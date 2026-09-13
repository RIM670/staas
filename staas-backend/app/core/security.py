import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES


def creer_access_token(client_id: int, role: str) -> str:
    """
    Génère un JWT signé contenant l'id du client et son rôle.
    Ce token est ce que le client doit présenter à chaque requête
    protégée, à la place de renvoyer email/mot de passe à chaque fois.
    """
    expiration = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    donnees_token = {
        "sub": str(client_id),  # "sub" = subject, convention JWT standard
        "role": role,
        "exp": expiration,
    }
    return jwt.encode(donnees_token, SECRET_KEY, algorithm=ALGORITHM)


def decoder_access_token(token: str) -> dict:
    """
    Décode et vérifie un JWT. Lève une exception si le token est
    invalide, falsifié, ou expiré.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise ValueError("Token invalide ou expiré")


def hasher_mot_de_passe(mot_de_passe: str) -> str:
    """Transforme un mot de passe en clair en hash bcrypt sécurisé."""
    mot_de_passe_bytes = mot_de_passe.encode("utf-8")
    sel = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(mot_de_passe_bytes, sel)
    return hash_bytes.decode("utf-8")


def verifier_mot_de_passe(mot_de_passe: str, mot_de_passe_hash: str) -> bool:
    """Vérifie qu'un mot de passe en clair correspond à un hash stocké."""
    return bcrypt.checkpw(
        mot_de_passe.encode("utf-8"), mot_de_passe_hash.encode("utf-8")
    )
