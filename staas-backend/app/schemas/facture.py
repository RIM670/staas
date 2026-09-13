from pydantic import BaseModel
from app.models.facture import TypeFacturation, StatutFacture
from datetime import datetime
from typing import Optional

class FactureCreate(BaseModel):
    type_facturation: TypeFacturation

class FactureOut(BaseModel):
    id: int
    type_facturation: TypeFacturation
    montant_ht: float
    remise_pct: float
    montant_ttc: float
    statut: StatutFacture
    periode_debut: datetime
    periode_fin: datetime
    date_creation: datetime
    pdf_path: Optional[str]

    class Config:
        from_attributes = True