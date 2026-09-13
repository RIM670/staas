import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from app.core.database import Base


class StatutCompte(str, enum.Enum):
    en_attente = "en_attente"
    valide = "valide"
    suspendu = "suspendu"


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    mot_de_passe_hash = Column(String, nullable=False)
    nom_entreprise = Column(String, nullable=True)
    numero_whatsapp = Column(String, nullable=True)
    statut = Column(Enum(StatutCompte), default=StatutCompte.en_attente, nullable=False)
    est_admin = Column(Boolean, default=False)
    date_creation = Column(DateTime, default=datetime.utcnow)
    nom = Column(String, nullable=True)
