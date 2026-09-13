from fastapi import FastAPI
from app.core.database import Base, engine
from app.routers import clients, admin, auth
from dotenv import load_dotenv
from app.routers import storage
from app.routers import dashboard
from app.routers import factures


load_dotenv()

# Crée automatiquement les tables dans PostgreSQL si elles n'existent pas encore
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="STaaS Platform API",
    description="API de la plateforme Storage as a Service",
    version="0.1.0",
)

app.include_router(clients.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(storage.router)
app.include_router(dashboard.router)
app.include_router(factures.router)

@app.get("/")
def accueil():
    return {"message": "API STaaS opérationnelle"}
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)