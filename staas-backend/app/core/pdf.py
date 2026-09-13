from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
import os

PDF_DIR = "factures_pdf"
os.makedirs(PDF_DIR, exist_ok=True)

def generer_pdf_facture(facture, client, details: dict) -> str:
    filename = f"{PDF_DIR}/facture_{facture.id}_{client.id}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # En-tête
    elements.append(Paragraph("<b>STaaS Platform</b>", styles["Title"]))
    elements.append(Spacer(1, 0.5 * cm))
    elements.append(Paragraph(f"<b>FACTURE N° {facture.id}</b>", styles["Heading2"]))
    elements.append(Spacer(1, 0.3 * cm))

    # Infos client
    elements.append(Paragraph(f"Client : {client.email}", styles["Normal"]))
    elements.append(Paragraph(f"Entreprise : {client.nom_entreprise or 'N/A'}", styles["Normal"]))
    elements.append(Paragraph(f"Date : {facture.date_creation.strftime('%d/%m/%Y')}", styles["Normal"]))
    elements.append(Paragraph(
        f"Période : {facture.periode_debut.strftime('%d/%m/%Y')} → {facture.periode_fin.strftime('%d/%m/%Y')}",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.5 * cm))

    # Tableau détail
    data = [
        ["Description", "Quota (GB)", "Tarif/GB/mois", "Durée", "Montant HT"],
        [
            f"Stockage {facture.type_facturation.value}",
            str(details["quota_total_gb"]),
            f"{0.5} DT",
            f"{details['duree_mois']} mois",
            f"{details['montant_ht']} DT"
        ],
        ["", "", "", "Remise", f"-{details['remise_pct']}%"],
        ["", "", "", "<b>Total TTC</b>", f"<b>{facture.montant_ttc} DT</b>"],
    ]

    table = Table(data, colWidths=[6*cm, 3*cm, 3*cm, 3*cm, 3*cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#ECF0F1")]),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 1 * cm))

    # Statut
    statut_color = "green" if facture.statut.value == "payee" else "red"
    elements.append(Paragraph(
        f'Statut : <font color="{statut_color}"><b>{facture.statut.value.upper()}</b></font>',
        styles["Normal"]
    ))

    doc.build(elements)
    return filename