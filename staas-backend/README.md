# STaaS Backend — Guide de démarrage

## Structure du projet

```
staas-backend/
├── app/
│   ├── main.py              # Point d'entrée de l'application
│   ├── core/
│   │   ├── config.py        # Lecture des variables d'environnement
│   │   ├── database.py      # Connexion PostgreSQL via SQLAlchemy
│   │   └── security.py      # Hashage des mots de passe (bcrypt)
│   ├── models/
│   │   └── client.py        # Modèle de la table "clients"
│   ├── schemas/
│   │   └── client.py        # Validation des données entrée/sortie API
│   └── routers/
│       ├── clients.py       # Route d'inscription
│       ├── admin.py         # Routes de validation admin
│       └── auth.py          # Route de login
├── requirements.txt
└── .env.example
```

## Installation sur Windows (VS Code)

### 1. Place les fichiers dans ton projet

Copie le dossier `app/` et le fichier `requirements.txt` dans ton dossier `staas-backend` existant (celui où tu as déjà créé ton environnement virtuel `venv`).

### 2. Active ton environnement virtuel

Dans le terminal VS Code (Git Bash) :
```bash
source venv/Scripts/activate
```

Ou en PowerShell :
```powershell
venv\Scripts\activate
```

Tu dois voir `(venv)` apparaître au début de la ligne.

### 3. Installe les dépendances

```bash
pip install -r requirements.txt
```

### 4. Crée ton fichier .env

Copie `.env.example` vers `.env` :
```bash
cp .env.example .env
```

Le fichier `.env` doit contenir (adapte si besoin) :
```
DATABASE_URL=postgresql://postgres:0000@localhost:5432/staas_db
SECRET_KEY=change-this-secret-key-in-production-please
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Vérifie que `staas_db` est bien le nom de la base que tu as créée dans pgAdmin, et que `0000` correspond à ton mot de passe PostgreSQL.

### 5. Lance le serveur

Toujours avec le venv actif, depuis le dossier racine `staas-backend` (celui qui contient le dossier `app/`) :

```bash
uvicorn app.main:app --reload
```

Tu dois voir un message du type :
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

Au démarrage, l'application crée automatiquement la table `clients` dans ta base PostgreSQL si elle n'existe pas encore.

## Tester l'API

### Documentation interactive automatique

Ouvre ton navigateur sur :
```
http://127.0.0.1:8000/docs
```

FastAPI génère automatiquement une interface où tu peux tester chaque route directement, sans Postman.

### Flux de test complet

1. **Inscription** — `POST /clients/register`
```json
{
  "email": "client1@example.com",
  "mot_de_passe": "motdepasse123",
  "nom_entreprise": "Ma Société"
}
```
Le compte est créé avec le statut `en_attente`.

2. **Tentative de login (doit échouer)** — `POST /auth/login`
```json
{
  "email": "client1@example.com",
  "mot_de_passe": "motdepasse123"
}
```
Réponse attendue : erreur 403, compte en attente de validation.

3. **Lister les comptes en attente (vue admin)** — `GET /admin/clients/en-attente`

Récupère l'`id` du client retourné.

4. **Valider le compte (vue admin)** — `PUT /admin/clients/{id}/valider`

5. **Login (doit réussir)** — `POST /auth/login`

Réponse attendue : message de succès avec `client_id`.

## Vérifier dans pgAdmin

Après l'inscription, ouvre pgAdmin → `staas_db` → Schemas → public → Tables → `clients` → clic droit → View/Edit Data → All Rows. Tu dois voir ta ligne client avec le mot de passe stocké sous forme de hash bcrypt (jamais en clair).

## Prochaines étapes (pas encore incluses)

- MFA via WhatsApp comme deuxième étape du login
- Génération de token JWT pour maintenir la session après login
- Endpoints de provisioning de stockage (connexion à Ceph)
