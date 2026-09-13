from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.ceph import creer_utilisateur_rgw
from app.core.database import get_db
from app.models.credentials import CredentialsS3
from app.models.client import Client, StatutCompte
from app.schemas.client import ClientCreate, ClientOut
from app.core.security import hasher_mot_de_passe

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.post("/register", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def inscrire_client(client_data: ClientCreate, db: Session = Depends(get_db)):
    client_existant = db.query(Client).filter(Client.email == client_data.email).first()
    if client_existant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte existe déjà avec cet email.",
        )

    nouveau_client = Client(
        email=client_data.email,
        mot_de_passe_hash=hasher_mot_de_passe(client_data.mot_de_passe),
        nom=client_data.nom,
        nom_entreprise=client_data.nom_entreprise,
        numero_whatsapp=client_data.numero_whatsapp,
        statut=StatutCompte.en_attente,
    )

    db.add(nouveau_client)
    db.commit()
    db.refresh(nouveau_client)

    try:
        nom_affichage = nouveau_client.nom or nouveau_client.email
        creds = creer_utilisateur_rgw(nouveau_client.id, nom_affichage)
        credentials = CredentialsS3(
            client_id=nouveau_client.id,
            uid_ceph=creds["uid"],
            access_key=creds["access_key"],
            secret_key=creds["secret_key"]
        )
        db.add(credentials)
        db.commit()
    except Exception as e:
        print(f"Erreur création compte RGW : {e}")

    return nouveau_client