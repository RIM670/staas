from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_client, exiger_admin
from app.models.storage import EspaceStockage, TypeStockage
from app.models.client import Client
import subprocess
import json

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

TARIF_PAR_GB = 0.5  # DT/GB/mois — ajuste selon ton sujet
TARIF_PAR_SLA = {
    "standard": 0.5,
    "premium": 0.4,
    "enterprise": 0.3,
}

def get_usage_s3(uid: str) -> float:
    """Retourne l'espace utilisé en GB pour un utilisateur S3."""
    try:
        result = subprocess.run(
            f"ssh rim@192.168.1.168 \"sudo radosgw-admin user info --uid={uid}\"",
            shell=True, capture_output=True, text=True, check=True
        )
        data = json.loads(result.stdout)
        bytes_used = data.get("stats", {}).get("size_actual", 0)
        return round(bytes_used / (1024 ** 3), 3)
    except Exception:
        return 0.0

def get_usage_rbd(volume_name: str) -> float:
    """Retourne la taille réelle utilisée d'un volume RBD en GB."""
    try:
        result = subprocess.run(
            f"ssh rim@192.168.1.168 \"sudo rbd du {volume_name}\"",
            shell=True, capture_output=True, text=True, check=True
        )
        lines = result.stdout.strip().split("\n")
        for line in lines[1:]:
            parts = line.split()
            if len(parts) >= 3:
                used = parts[2]
                if "GiB" in used:
                    return float(used.replace("GiB", ""))
                elif "MiB" in used:
                    return round(float(used.replace("MiB", "")) / 1024, 3)
        return 0.0
    except Exception:
        return 0.0

def get_usage_nfs() -> float:
    """Retourne l'usage global CephFS en GB."""
    try:
        result = subprocess.run(
            f"ssh rim@192.168.1.168 \"sudo ceph df --format json\"",
            shell=True, capture_output=True, text=True, check=True
        )
        data = json.loads(result.stdout)
        bytes_used = data.get("stats", {}).get("total_used_raw_bytes", 0)
        return round(bytes_used / (1024 ** 3), 3)
    except Exception:
        return 0.0


@router.get("/me")
def dashboard_client(
    db: Session = Depends(get_db),
    current_client=Depends(get_current_client)
):
    espaces = db.query(EspaceStockage).filter(
        EspaceStockage.client_id == current_client.id
    ).all()

    result = []
    total_cout = 0.0

    for espace in espaces:
        uid = f"client{current_client.id}"

        if espace.type_stockage == TypeStockage.s3:
            utilise_gb = get_usage_s3(uid)
        elif espace.type_stockage == TypeStockage.rbd:
            utilise_gb = get_usage_rbd(espace.details)
        else:
            utilise_gb = get_usage_nfs()

        pourcentage = round((utilise_gb / espace.quota_gb) * 100, 1) if espace.quota_gb > 0 else 0
        tarif = TARIF_PAR_SLA.get(espace.type_stockage if isinstance(espace.sla, str) else espace.sla.value if espace.sla else "standard", 0.5)
        cout_mois = round(espace.quota_gb * tarif, 2)
        total_cout += cout_mois

        result.append({
            "espace_id": espace.id,
            "nom": espace.nom,
            "type": espace.type_stockage,
            "quota_gb": espace.quota_gb,
            "utilise_gb": utilise_gb,
            "pourcentage": pourcentage,
            "cout_mois": cout_mois
        })

    return {
        "espaces": result,
        "total_cout_mois": round(total_cout, 2)
    }


@router.get("/admin")
def dashboard_admin(
    db: Session = Depends(get_db),
    admin=Depends(exiger_admin)
):
    clients = db.query(Client).filter(Client.est_admin == False).all()
    result = []
    total_global = 0.0

    for client in clients:
        espaces = db.query(EspaceStockage).filter(
            EspaceStockage.client_id == client.id
        ).all()

        quota_total = sum(e.quota_gb for e in espaces)
        cout_total = round(quota_total * TARIF_PAR_GB, 2)
        total_global += cout_total

        result.append({
            "client_id": client.id,
            "client_nom": client.nom if client.nom else client.email,
            "email": client.email,
            "nom_entreprise": client.nom_entreprise,
            "nb_espaces": len(espaces),
            "quota_total_gb": quota_total,
            "cout_mensuel": cout_total
})

    return {
        "clients": result,
        "total_global_mois": round(total_global, 2)
    }