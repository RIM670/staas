from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.client import StatutCompte


class ClientCreate(BaseModel):
    email: EmailStr
    mot_de_passe: str
    nom: Optional[str] = None
    nom_entreprise: Optional[str] = None
    numero_whatsapp: Optional[str] = None


class ClientOut(BaseModel):
    id: int
    email: EmailStr
    nom: Optional[str]
    nom_entreprise: Optional[str]
    statut: StatutCompte
    date_creation: datetime

    class Config:
        from_attributes = True


class ClientLogin(BaseModel):
    email: EmailStr
    mot_de_passe: str
