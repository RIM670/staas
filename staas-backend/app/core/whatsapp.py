import httpx
import os

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_ID")

async def envoyer_otp_whatsapp(numero: str, code: str):
    # ─────────────────────────────────────────────────────────
    # MODE DÉVELOPPEMENT — WhatsApp temporairement restreint
    # Le code OTP est affiché dans les logs du serveur Uvicorn
    # Quand WhatsApp sera rétabli, décommente le bloc ci-dessous
    # et supprime le print
    # ─────────────────────────────────────────────────────────
    print(f"\n{'='*50}")
    print(f"[OTP] Numéro : {numero}")
    print(f"[OTP] Code   : {code}")
    print(f"{'='*50}\n")

    # ── À réactiver quand WhatsApp est rétabli ──────────────
    # url = f"https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages"
    # headers = {
    #     "Authorization": f"Bearer {WHATSAPP_TOKEN}",
    #     "Content-Type": "application/json"
    # }
    # payload = {
    #     "messaging_product": "whatsapp",
    #     "to": numero,
    #     "type": "text",
    #     "text": {"body": f"Votre code STaaS : *{code}*\nValide 5 minutes."}
    # }
    # async with httpx.AsyncClient() as client:
    #     r = await client.post(url, headers=headers, json=payload)
    #     print(f"META RESPONSE: {r.status_code} {r.text}")
    #     r.raise_for_status()