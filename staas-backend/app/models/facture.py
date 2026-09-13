from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from app.core.database import Base
from datetime import datetime
import enum

class TypeFacturation(str, enum.Enum):
    pack_1_mois = "pack_1_mois"
    pack_3_mois = "pack_3_mois"
    pack_6_mois = "pack_6_mois"
    pack_annuel = "pack_annuel"
    pay_as_you_go = "pay_as_you_go"

class StatutFacture(str, enum.Enum):
    non_payee = "non_payee"
    payee = "payee"

class Facture(Base):
    __tablename__ = "factures"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    type_facturation = Column(Enum(TypeFacturation), nullable=False)
    montant_ht = Column(Float, nullable=False)
    remise_pct = Column(Float, default=0.0)
    montant_ttc = Column(Float, nullable=False)
    statut = Column(Enum(StatutFacture), default=StatutFacture.non_payee)
    periode_debut = Column(DateTime, nullable=False)
    periode_fin = Column(DateTime, nullable=False)
    date_creation = Column(DateTime, default=datetime.utcnow)
    pdf_path = Column(String, nullable=True)