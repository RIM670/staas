from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verifier_mot_de_passe, creer_access_token
from app.models.client import Client, StatutCompte
from app.models.otp import OtpCode
from app.schemas.client import ClientLogin
from app.core.whatsapp import envoyer_otp_whatsapp
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(data: ClientLogin, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.email == data.email).first()
    if not client or not verifier_mot_de_passe(data.mot_de_passe, client.mot_de_passe_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if client.statut == StatutCompte.en_attente:
        raise HTTPException(status_code=403, detail="Compte en attente de validation")
    if client.statut == StatutCompte.suspendu:
        raise HTTPException(status_code=403, detail="Compte suspendu")

    # Invalider les anciens codes non utilisés
    db.query(OtpCode).filter(
        OtpCode.client_id == client.id,
        OtpCode.utilise == False
    ).update({"utilise": True})

    # Générer et sauvegarder le nouveau code
    code = str(random.randint(100000, 999999))
    otp = OtpCode(
        client_id=client.id,
        code=code,
        expire_at=datetime.utcnow() + timedelta(minutes=5)
    )
    db.add(otp)
    db.commit()

    # Envoyer via WhatsApp
    await envoyer_otp_whatsapp(client.numero_whatsapp, code)

    return {"message": "Code OTP envoyé sur WhatsApp"}


@router.post("/verify-otp")
def verify_otp(email: str, code: str, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.email == email).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")

    otp = db.query(OtpCode).filter(
        OtpCode.client_id == client.id,
        OtpCode.code == code,
        OtpCode.utilise == False,
        OtpCode.expire_at > datetime.utcnow()
    ).first()

    if not otp:
        raise HTTPException(status_code=400, detail="Code invalide ou expiré")

    otp.utilise = True
    db.commit()

    # Génération du token JWT — c'est ce token que le client va
    # garder et présenter à chaque requête protégée par la suite.
    role = "admin" if client.est_admin else "client"
    token = creer_access_token(client_id=client.id, role=role)

    return {
        "message": "Authentification réussie",
        "access_token": token,
        "token_type": "bearer",
        "client_id": client.id,
    }
