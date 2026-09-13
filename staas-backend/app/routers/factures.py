from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_client, exiger_admin
from app.models.facture import Facture, StatutFacture
from app.models.client import Client
from app.schemas.facture import FactureCreate, FactureOut
from app.core.facturation import calculer_montant, DUREES
from app.core.pdf import generer_pdf_facture
from datetime import datetime
from dateutil.relativedelta import relativedelta
from typing import List
from app.core.scheduler import generer_et_envoyer_factures_mensuelles
from app.core.deps import exiger_admin

router = APIRouter(prefix="/factures", tags=["factures"])

@router.post("/generer", response_model=FactureOut)
def generer_facture(
    data: FactureCreate,
    db: Session = Depends(get_db),
    current_client=Depends(get_current_client)
):
    details = calculer_montant(current_client.id, data.type_facturation.value, db)
    if details["quota_total_gb"] == 0:
        raise HTTPException(status_code=400, detail="Aucun espace de stockage actif")

    now = datetime.utcnow()
    duree = DUREES[data.type_facturation.value]
    periode_fin = now + relativedelta(months=duree)

    facture = Facture(
        client_id=current_client.id,
        type_facturation=data.type_facturation,
        montant_ht=details["montant_ht"],
        remise_pct=details["remise_pct"],
        montant_ttc=details["montant_ttc"],
        periode_debut=now,
        periode_fin=periode_fin
    )
    db.add(facture)
    db.commit()
    db.refresh(facture)

    # Générer le PDF
    pdf_path = generer_pdf_facture(facture, current_client, details)
    facture.pdf_path = pdf_path
    db.commit()
    db.refresh(facture)

    return facture


@router.get("/mes-factures", response_model=List[FactureOut])
def mes_factures(
    db: Session = Depends(get_db),
    current_client=Depends(get_current_client)
):
    return db.query(Facture).filter(Facture.client_id == current_client.id).all()


@router.get("/{facture_id}/pdf")
def telecharger_pdf(
    facture_id: int,
    db: Session = Depends(get_db),
    current_client=Depends(get_current_client)
):
    facture = db.query(Facture).filter(
        Facture.id == facture_id,
        Facture.client_id == current_client.id
    ).first()
    if not facture or not facture.pdf_path:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    return FileResponse(facture.pdf_path, media_type="application/pdf", filename=f"facture_{facture_id}.pdf")


# Routes admin
@router.get("/admin/toutes")
def toutes_factures(
    db: Session = Depends(get_db),
    admin=Depends(exiger_admin)
):
    factures = db.query(Facture).all()
    result = []
    for f in factures:
        client = db.query(Client).filter(Client.id == f.client_id).first()
        result.append({
            "id": f.id,
            "client_id": f.client_id,
            "client_nom": client.nom if client and client.nom else client.email,
            "type_facturation": f.type_facturation,
            "montant_ht": f.montant_ht,
            "remise_pct": f.remise_pct,
            "montant_ttc": f.montant_ttc,
            "statut": f.statut,
            "periode_debut": f.periode_debut,
            "periode_fin": f.periode_fin,
            "date_creation": f.date_creation,
            "pdf_path": f.pdf_path
        })
    return result

@router.put("/admin/{facture_id}/marquer-payee", dependencies=[Depends(exiger_admin)])
def marquer_payee(facture_id: int, db: Session = Depends(get_db)):
    facture = db.query(Facture).filter(Facture.id == facture_id).first()
    if not facture:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    facture.statut = StatutFacture.payee
    db.commit()
    return {"message": "Facture marquée comme payée"}


@router.post("/admin/declencher-facturation-mensuelle", dependencies=[Depends(exiger_admin)])
def declencher_manuellement():
    generer_et_envoyer_factures_mensuelles()
    return {"message": "Facturation mensuelle déclenchée et emails envoyés"}