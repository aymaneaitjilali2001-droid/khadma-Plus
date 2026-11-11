# Docling PDF Service

Microservice Flask chargé d'extraire le contenu structuré des CV PDF avec Docling.

## Installation

```bash
py -3.12 -m pip install -r requirements.txt
```

## Démarrage

```bash
py -3.12 app.py
```

Le service écoute par défaut sur `http://127.0.0.1:8000`.

Structure du service :

```text
docling_service/
├── config.py              # Configuration OpenAI et schémas attendus
├── resume_extractor.py    # Docling + extraction du CV
├── candidate_evaluator.py # Prompt et évaluation du candidat
└── routes.py              # Endpoints Flask
```

Le service utilise les variables d'environnement suivantes :

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=
OPENAI_REQUEST_TIMEOUT_MS=60000
OPENAI_MAX_RETRIES=2
```

## Endpoint

```http
POST /extract
Content-Type: multipart/form-data
Champ : file
```

Cette route extrait le CV avec Docling et OpenAI.

Pour extraire et évaluer un CV en une seule requête :

```http
POST /process
Content-Type: multipart/form-data
Champs : file, job_description
```

Cette route retourne le CV structuré et l'évaluation du candidat.
