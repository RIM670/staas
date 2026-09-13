from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decoder_access_token
from app.models.client import Client

# Indique à FastAPI/Swagger où le client doit obtenir son token
# (utile pour la documentation interactive /docs, pas une vraie route de login OAuth)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/verify-otp")


def get_current_client(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Client:
    """
    Lit le token JWT envoyé dans l'en-tête Authorization, vérifie sa
    validité, et retourne le client correspondant. Toute route qui
    dépend de cette fonction devient automatiquement protégée :
    sans token valide, la requête est refusée avant même d'exécuter
    le code de la route.
    """
    erreur_auth = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de vérifier les identifiants.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decoder_access_token(token)
        client_id = payload.get("sub")
        if client_id is None:
            raise erreur_auth
    except ValueError:
        raise erreur_auth

    client = db.query(Client).filter(Client.id == int(client_id)).first()
    if client is None:
        raise erreur_auth

    return client


def exiger_admin(client_actuel: Client = Depends(get_current_client)) -> Client:
    """
    Variante de get_current_client qui exige en plus que le client
    soit administrateur. À utiliser sur toutes les routes /admin/...
    """
    if not client_actuel.est_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs.",
        )
    return client_actuel
