from pydantic import BaseModel
from app.models.storage import TypeStockage, StatutEspace, NiveauSLA
from datetime import datetime
from typing import Optional

SLA_LIMITES = {
    NiveauSLA.standard: 50,
    NiveauSLA.premium: 200,
    NiveauSLA.enterprise: 1024,
}

SLA_TARIFS = {
    NiveauSLA.standard: 0.5,
    NiveauSLA.premium: 0.4,
    NiveauSLA.enterprise: 0.3,
}

class EspaceCreate(BaseModel):
    nom: str
    type_stockage: TypeStockage
    quota_gb: int
    sla: NiveauSLA = NiveauSLA.standard

class EspaceOut(BaseModel):
    id: int
    nom: str
    type_stockage: TypeStockage
    quota_gb: int
    statut: StatutEspace
    sla: NiveauSLA
    details: Optional[str]
    date_creation: datetime

    class Config:
        from_attributes = True