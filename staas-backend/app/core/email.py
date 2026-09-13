import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")

def envoyer_facture_email(destinataire: str, facture, pdf_path: str):
    msg = MIMEMultipart()
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = destinataire
    msg["Subject"] = f"STaaS Platform - Facture N°{facture.id}"

    corps = f"""
Bonjour,

Veuillez trouver ci-joint votre facture STaaS Platform N°{facture.id}.

Montant TTC : {facture.montant_ttc} DT
Période : {facture.periode_debut.strftime('%d/%m/%Y')} au {facture.periode_fin.strftime('%d/%m/%Y')}
Statut : {facture.statut.value}

Cordialement,
L'équipe STaaS Platform
"""
    msg.attach(MIMEText(corps, "plain"))

    with open(pdf_path, "rb") as f:
        part = MIMEApplication(f.read(), Name=f"facture_{facture.id}.pdf")
        part["Content-Disposition"] = f'attachment; filename="facture_{facture.id}.pdf"'
        msg.attach(part)

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
        server.send_message(msg)
def envoyer_email_simple(destinataire: str, sujet: str, corps: str):
    msg = MIMEMultipart()
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = destinataire
    msg["Subject"] = sujet
    msg.attach(MIMEText(corps, "plain"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
        server.send_message(msg)