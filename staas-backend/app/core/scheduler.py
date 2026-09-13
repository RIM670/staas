from apscheduler.schedulers.background import BackgroundScheduler
from app.core.database import SessionLocal
from app.models.client import Client
from app.models.facture import Facture, TypeFacturation
from app.core.facturation import calculer_montant, DUREES
from app.core.pdf import generer_pdf_facture
from app.core.email import envoyer_facture_email
from datetime import datetime
from dateutil.relativedelta import relativedelta

def generer_et_envoyer_factures_mensuelles():
    """Génère et envoie automatiquement une facture pay_as_you_go pour chaque client actif, le 1er de chaque mois."""
    db = SessionLocal()
    try:
        clients = db.query(Client).filter(Client.est_admin == False, Client.statut == "valide").all()

        for client in clients:
            details = calculer_montant(client.id, "pay_as_you_go", db)
            if details["quota_total_gb"] == 0:
                continue  # pas d'espace actif, pas de facture

            now = datetime.utcnow()
            periode_fin = now + relativedelta(months=1)

            facture = Facture(
                client_id=client.id,
                type_facturation=TypeFacturation.pay_as_you_go,
                montant_ht=details["montant_ht"],
                remise_pct=details["remise_pct"],
                montant_ttc=details["montant_ttc"],
                periode_debut=now,
                periode_fin=periode_fin
            )
            db.add(facture)
            db.commit()
            db.refresh(facture)

            pdf_path = generer_pdf_facture(facture, client, details)
            facture.pdf_path = pdf_path
            db.commit()

            try:
                envoyer_facture_email(client.email, facture, pdf_path)
                print(f"Facture envoyée à {client.email}")
            except Exception as e:
                print(f"Erreur envoi email pour {client.email}: {e}")
    finally:
        db.close()


def demarrer_scheduler():
    scheduler = BackgroundScheduler()
    # Production : le 1er de chaque mois à 8h
    scheduler.add_job(generer_et_envoyer_factures_mensuelles, "cron", day=1, hour=8)
    scheduler.start()
    return scheduler