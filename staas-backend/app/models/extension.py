from sqlalchemy import Column, Integer, ForeignKey, Enum, DateTime
from app.core.database import Base
from datetime import datetime
import enum

class StatutExtension(str, enum.Enum):
    en_attente = "en_attente"
    approuvee = "approuvee"
    refusee = "refusee"

class DemandeExtension(Base):
    __tablename__ = "demandes_extension"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    espace_id = Column(Integer, ForeignKey("espaces_stockage.id"), nullable=False)
    quota_actuel = Column(Integer, nullable=False)
    nouveau_quota = Column(Integer, nullable=False)
    statut = Column(Enum(StatutExtension), default=StatutExtension.en_attente)
    date_creation = Column(DateTime, default=datetime.utcnow)
    date_traitement = Column(DateTime, nullable=True)