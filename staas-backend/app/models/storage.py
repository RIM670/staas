from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from app.core.database import Base
from datetime import datetime
import enum

class TypeStockage(str, enum.Enum):
    s3 = "s3"
    nfs = "nfs"
    rbd = "rbd"
    smb = "smb"

class NiveauSLA(str, enum.Enum):
    standard = "standard"
    premium = "premium"
    enterprise = "enterprise"

class StatutEspace(str, enum.Enum):
    en_attente = "en_attente"
    actif = "actif"
    suspendu = "suspendu"
    supprime = "supprime"
    refuse = "refuse"

class EspaceStockage(Base):
    __tablename__ = "espaces_stockage"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    nom = Column(String, nullable=False)
    type_stockage = Column(Enum(TypeStockage), nullable=False)
    quota_gb = Column(Integer, nullable=False)
    statut = Column(Enum(StatutEspace), default=StatutEspace.en_attente)
    sla = Column(Enum(NiveauSLA), default=NiveauSLA.standard)
    details = Column(String, nullable=True)
    date_creation = Column(DateTime, default=datetime.utcnow)