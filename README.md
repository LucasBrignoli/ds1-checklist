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

## Cómo sigue

- Los ítems (`backend/data/items.json`) son fijos por ahora; si querés sumar
  Dark Souls 3 o Elden Ring, la idea más simple es agregar un campo `juego`
  a cada ítem y un selector arriba de las pestañas de categoría.
- El flag `missable` se generó heurísticamente buscando frases como
  "es necesario", "de lo contrario", "bloquea" en la ubicación. Vale la pena
  revisarlo a mano a medida que juegues, porque puede haber falsos negativos.
- `progress.json` es el "estado guardado" — está en `.gitignore` para no
  versionar tu propio progreso. Si en algún momento sumás usuarios (por
  ejemplo para compararte con amigos), ahí sí conviene pasar a una base de
  datos real (SQLite) en vez de un JSON plano.
- Para GitFlow: `main` estable, ramas `feature/agregar-ds3`,
  `feature/comparar-progreso`, etc., como en el TP.
