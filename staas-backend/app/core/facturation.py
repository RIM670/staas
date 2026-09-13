from app.models.storage import EspaceStockage, NiveauSLA
from sqlalchemy.orm import Session

TARIF_PAR_SLA = {
    "standard": 0.5,
    "premium": 0.4,
    "enterprise": 0.3,
}

REMISES = {
    "pack_1_mois": 0.0,
    "pack_3_mois": 0.10,
    "pack_6_mois": 0.15,
    "pack_annuel": 0.20,
    "pay_as_you_go": 0.0,
}

DUREES = {
    "pack_1_mois": 1,
    "pack_3_mois": 3,
    "pack_6_mois": 6,
    "pack_annuel": 12,
    "pay_as_you_go": 1,
}

def calculer_montant(client_id: int, type_facturation: str, db: Session):
    espaces = db.query(EspaceStockage).filter(
        EspaceStockage.client_id == client_id,
        EspaceStockage.statut == "actif"
    ).all()

    duree = DUREES[type_facturation]
    remise = REMISES[type_facturation]
    montant_ht = 0
    quota_total = 0

    for espace in espaces:
        tarif = TARIF_PAR_SLA.get(
            espace.sla.value if espace.sla else "standard", 0.5
        )
        montant_ht += espace.quota_gb * tarif * duree
        quota_total += espace.quota_gb

    montant_ttc = round(montant_ht * (1 - remise), 2)
    return {
        "montant_ht": round(montant_ht, 2),
        "remise_pct": remise * 100,
        "montant_ttc": montant_ttc,
        "quota_total_gb": quota_total,
        "duree_mois": duree
    }