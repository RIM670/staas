from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import exiger_admin
from app.models.client import Client, StatutCompte
from app.models.credentials import CredentialsS3
from app.schemas.client import ClientOut
from app.models.extension import DemandeExtension, StatutExtension
from app.models.storage import EspaceStockage, StatutEspace, TypeStockage
from app.core.ceph import creer_bucket_s3, creer_bucket_s3_client, creer_export_nfs, creer_volume_rbd, creer_partage_smb, modifier_quota_s3
from app.core.email import envoyer_email_simple
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/clients/en-attente", response_model=List[ClientOut])
def lister_clients_en_attente(
    db: Session = Depends(get_db),
    admin_actuel: Client = Depends(exiger_admin),
):
    return db.query(Client).filter(Client.statut == StatutCompte.en_attente).all()


@router.put("/clients/{client_id}/valider", response_model=ClientOut)
def valider_client(
    client_id: int,
    db: Session = Depends(get_db),
    admin_actuel: Client = Depends(exiger_admin),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client introuvable.")

    client.statut = StatutCompte.valide
    db.commit()
    db.refresh(client)

    try:
        envoyer_email_simple(
            destinataire=client.email,
            sujet="STaaS Platform - Compte activé",
            corps=f"""Bonjour {client.nom or client.email},

Votre compte STaaS Platform a été validé par un administrateur.

Vous pouvez maintenant vous connecter et commencer à utiliser nos services de stockage.

Accès : http://localhost:3000

Cordialement,
L'équipe STaaS Platform"""
        )
    except Exception as e:
        print(f"Erreur envoi email : {e}")

    return client


@router.put("/clients/{client_id}/suspendre", response_model=ClientOut)
def suspendre_client(
    client_id: int,
    db: Session = Depends(get_db),
    admin_actuel: Client = Depends(exiger_admin),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client introuvable.")

    client.statut = StatutCompte.suspendu
    db.commit()
    db.refresh(client)
    return client


@router.get("/extensions/en-attente")
def extensions_en_attente(
    db: Session = Depends(get_db),
    admin=Depends(exiger_admin)
):
    demandes = db.query(DemandeExtension).filter(
        DemandeExtension.statut == StatutExtension.en_attente
    ).all()

    result = []
    for d in demandes:
        espace = db.query(EspaceStockage).filter(EspaceStockage.id == d.espace_id).first()
        client = db.query(Client).filter(Client.id == d.client_id).first()
        result.append({
            "id": d.id,
            "client_id": d.client_id,
            "client_nom": client.nom if client and client.nom else client.email,
            "espace_id": d.espace_id,
            "espace_nom": espace.nom if espace else "—",
            "quota_actuel": d.quota_actuel,
            "nouveau_quota": d.nouveau_quota,
            "statut": d.statut,
            "date_creation": d.date_creation,
            "date_traitement": d.date_traitement
        })
    return result


@router.put("/extensions/{id}/approuver")
def approuver_extension(
    id: int,
    db: Session = Depends(get_db),
    admin=Depends(exiger_admin)
):
    demande = db.query(DemandeExtension).filter(DemandeExtension.id == id).first()
    if not demande:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    if demande.statut != StatutExtension.en_attente:
        raise HTTPException(status_code=400, detail="Demande déjà traitée")

    espace = db.query(EspaceStockage).filter(EspaceStockage.id == demande.espace_id).first()

    try:
        if espace.type_stockage == TypeStockage.s3:
            modifier_quota_s3(espace.details, demande.nouveau_quota)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Ceph : {str(e)}")

    espace.quota_gb = demande.nouveau_quota
    demande.statut = StatutExtension.approuvee
    demande.date_traitement = datetime.utcnow()
    db.commit()

    return {"message": "Extension approuvée", "nouveau_quota": demande.nouveau_quota}


@router.put("/extensions/{id}/refuser")
def refuser_extension(
    id: int,
    db: Session = Depends(get_db),
    admin=Depends(exiger_admin)
):
    demande = db.query(DemandeExtension).filter(DemandeExtension.id == id).first()
    if not demande:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    demande.statut = StatutExtension.refusee
    demande.date_traitement = datetime.utcnow()
    db.commit()
    return {"message": "Extension refusée"}


@router.get("/storage/en-attente")
def espaces_en_attente(
    db: Session = Depends(get_db),
    admin=Depends(exiger_admin)
):
    espaces = db.query(EspaceStockage).filter(
        EspaceStockage.statut == StatutEspace.en_attente
    ).all()

    result = []
    for espace in espaces:
        client = db.query(Client).filter(Client.id == espace.client_id).first()
        result.append({
            "id": espace.id,
            "client_id": espace.client_id,
            "client_nom": client.nom if client and client.nom else client.email,
            "nom": espace.nom,
            "type_stockage": espace.type_stockage,
            "quota_gb": espace.quota_gb,
            "details": espace.details,
            "statut": espace.statut,
            "date_creation": espace.date_creation
        })
    return result


@router.put("/storage/{espace_id}/approuver")
def approuver_espace(
    espace_id: int,
    db: Session = Depends(get_db),
    admin=Depends(exiger_admin)
):
    espace = db.query(EspaceStockage).filter(EspaceStockage.id == espace_id).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace introuvable")
    if espace.statut != StatutEspace.en_attente:
        raise HTTPException(status_code=400, detail="Demande déjà traitée")

    try:
        if espace.type_stockage == TypeStockage.s3:
            creds = db.query(CredentialsS3).filter(
                CredentialsS3.client_id == espace.client_id
            ).first()
            if creds:
                creer_bucket_s3_client(espace.details, espace.quota_gb, creds.access_key, creds.secret_key)
            else:
                creer_bucket_s3(espace.details, espace.quota_gb)
        elif espace.type_stockage == TypeStockage.nfs:
            creer_export_nfs(espace.details, espace.quota_gb)
        elif espace.type_stockage == TypeStockage.rbd:
            creer_volume_rbd(espace.details, espace.quota_gb)
        elif espace.type_stockage == TypeStockage.smb:
            creer_partage_smb(espace.details, espace.quota_gb)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Ceph : {str(e)}")

    espace.statut = StatutEspace.actif
    db.commit()

    client = db.query(Client).filter(Client.id == espace.client_id).first()

    # Email avec clés S3 si type S3
    if espace.type_stockage == TypeStockage.s3 and creds:
        try:
            envoyer_email_simple(
                destinataire=client.email,
                sujet="STaaS Platform - Vos clés S3 personnelles",
                corps=f"""Bonjour {client.nom or client.email},

Votre espace de stockage S3 a été approuvé et créé.

Bucket     : {espace.details}
Endpoint   : http://192.168.1.168:7480
Access Key : {creds.access_key}
Secret Key : {creds.secret_key}

Cordialement,
L'équipe STaaS Platform"""
            )
        except Exception as e:
            print(f"Erreur envoi clés email : {e}")
    else:
        try:
            envoyer_email_simple(
                destinataire=client.email,
                sujet="STaaS Platform - Espace de stockage approuvé",
                corps=f"""Bonjour {client.nom or client.email},

Votre demande de création d'espace de stockage a été approuvée.

Nom : {espace.nom}
Type : {espace.type_stockage.value.upper()}
Quota : {espace.quota_gb} GB
Détails : {espace.details}

Votre espace est maintenant actif et prêt à l'utilisation.

Cordialement,
L'équipe STaaS Platform"""
            )
        except Exception as e:
            print(f"Erreur envoi email : {e}")

    return {"message": "Espace approuvé et créé sur Ceph", "espace_id": espace_id}


@router.put("/storage/{espace_id}/refuser")
def refuser_espace(
    espace_id: int,
    db: Session = Depends(get_db),
    admin=Depends(exiger_admin)
):
    espace = db.query(EspaceStockage).filter(EspaceStockage.id == espace_id).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace introuvable")

    espace.statut = StatutEspace.refuse
    db.commit()

    client = db.query(Client).filter(Client.id == espace.client_id).first()
    try:
        envoyer_email_simple(
            destinataire=client.email,
            sujet="STaaS Platform - Demande de stockage refusée",
            corps=f"""Bonjour {client.nom or client.email},

Votre demande de création d'espace de stockage a été refusée.

Nom : {espace.nom}
Type : {espace.type_stockage.value.upper()}
Quota : {espace.quota_gb} GB

Pour plus d'informations, contactez l'administrateur.

Cordialement,
L'équipe STaaS Platform"""
        )
    except Exception as e:
        print(f"Erreur envoi email : {e}")

    return {"message": "Demande refusée"}