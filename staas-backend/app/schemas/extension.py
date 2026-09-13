from pydantic import BaseModel
from app.models.extension import StatutExtension
from datetime import datetime
from typing import Optional

class ExtensionCreate(BaseModel):
    nouveau_quota: int

class ExtensionOut(BaseModel):
    id: int
    espace_id: int
    quota_actuel: int
    nouveau_quota: int
    statut: StatutExtension
    date_creation: datetime
    date_traitement: Optional[datetime]

    class Config:
        from_attributes = True