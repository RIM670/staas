from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_client
from app.models.storage import EspaceStockage, StatutEspace, TypeStockage
from app.schemas.storage import EspaceCreate, EspaceOut
from app.core.ceph import creer_bucket_s3, creer_export_nfs, creer_volume_rbd
from typing import List
from app.models.extension import DemandeExtension
from app.schemas.extension import ExtensionCreate, ExtensionOut
from app.models.storage import EspaceStockage, TypeStockage, StatutEspace, NiveauSLA
from app.schemas.storage import EspaceCreate, EspaceOut, SLA_LIMITES

router = APIRouter(prefix="/storage", tags=["storage"])



@router.post("/provision", response_model=EspaceOut)
def provisionner(
    data: EspaceCreate,
    db: Session = Depends(get_db),
    current_client=Depends(get_current_client)
):
    # Vérifier que le quota respecte la limite SLA
    quota_max = SLA_LIMITES[data.sla]
    if data.quota_gb > quota_max:
        raise HTTPException(
            status_code=400,
            detail=f"Quota {data.quota_gb}GB dépasse la limite SLA {data.sla.value} ({quota_max}GB max)"
        )

    nom_unique = f"client{current_client.id}-{data.nom}".lower().replace(" ", "-")

    espace = EspaceStockage(
        client_id=current_client.id,
        nom=data.nom,
        type_stockage=data.type_stockage,
        quota_gb=data.quota_gb,
        sla=data.sla,
        statut=StatutEspace.en_attente,
        details=nom_unique
    )
    db.add(espace)
    db.commit()
    db.refresh(espace)
    return espace


@router.get("/mes-espaces", response_model=List[EspaceOut])
def mes_espaces(
    db: Session = Depends(get_db),
    current_client=Depends(get_current_client)
):
    return db.query(EspaceStockage).filter(
        EspaceStockage.client_id == current_client.id
    ).all()

@router.post("/{espace_id}/demande-extension", response_model=ExtensionOut)
def demande_extension(
    espace_id: int,
    data: ExtensionCreate,
    db: Session = Depends(get_db),
    current_client=Depends(get_current_client)
):
    espace = db.query(EspaceStockage).filter(
        EspaceStockage.id == espace_id,
        EspaceStockage.client_id == current_client.id
    ).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace introuvable")
    if data.nouveau_quota <= espace.quota_gb:
        raise HTTPException(status_code=400, detail="Le nouveau quota doit être supérieur au quota actuel")

    demande = DemandeExtension(
        client_id=current_client.id,
        espace_id=espace_id,
        quota_actuel=espace.quota_gb,
        nouveau_quota=data.nouveau_quota
    )
    db.add(demande)
    db.commit()
    db.refresh(demande)
    return demande
from app.models.credentials import CredentialsS3

@router.get("/mes-credentials-s3")
def mes_credentials(
    db: Session = Depends(get_db),
    current_client=Depends(get_current_client)
):
    creds = db.query(CredentialsS3).filter(
        CredentialsS3.client_id == current_client.id
    ).first()
    if not creds:
        raise HTTPException(status_code=404, detail="Aucune clé S3 trouvée")
    return {
        "uid": creds.uid_ceph,
        "access_key": creds.access_key,
        "secret_key": creds.secret_key,
        "endpoint": "http://192.168.1.168:7480"
    }