# DS1 Checklist

Checklist interactivo de armas, hechizos, milagros, piromancias y pactos de
Dark Souls Remastered, con filtros y progreso guardado. Datos extraídos del
excel original (136 ítems).

Stack: FastAPI (backend) + React con Vite (frontend), sin librerías de UI
extra — mismo criterio que el TP de análisis de chats de WhatsApp.

## Estructura

```
ds1-checklist/
├── backend/
│   ├── main.py            # API: /api/items, /api/progress
│   ├── requirements.txt
│   └── data/
│       ├── items.json     # los 136 ítems (fijo)
│       └── progress.json  # se crea solo al guardar el primer check
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── index.css
```

## Cómo correrlo

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # en Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Queda escuchando en `http://localhost:8000`. Podés chequear
`http://localhost:8000/api/health`.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre en `http://localhost:5173`. El `vite.config.js` ya tiene un proxy de
`/api` hacia `http://localhost:8000`, así que el frontend no necesita saber
la URL del backend.
