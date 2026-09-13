from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    Fournit une session de base de données pour chaque requête,
    et la ferme automatiquement une fois la requête terminée.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
