# CSV Insights Dashboard

An AI-powered web application that lets users upload CSV files, preview data, generate intelligent insights using LLMs, and export reports.

**Live Demo**: [Add your deployment URL here]

## Features

- **CSV Upload** — Drag-and-drop or file picker, supports up to 25 MB
- **Data Preview** — Tabular view of your data with row/column counts
- **AI Insights** — Auto-generated analysis using StepFun LLM via OpenRouter
- **Charts** — Bar charts for numeric statistics and categorical distributions
- **Follow-up Questions** — Ask the AI anything about your uploaded data
- **Export** — Copy insights to clipboard or download as Markdown
- **Report History** — Access your last 5 reports
- **Health Status** — Real-time backend, database, and LLM health monitoring
- **Input Validation** — File type, size, and emptiness checks on both frontend and backend

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19, Vite 7, Chart.js, Axios       |
| Backend   | Django 5, Django REST Framework          |
| Database  | SQLite (file-based, zero config)         |
| AI/LLM    | OpenRouter API → StepFun Step-3.5 Flash  |
| Styling   | Vanilla CSS (light professional theme)   |
| Deployment| Docker, Gunicorn, WhiteNoise             |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- An [OpenRouter](https://openrouter.ai/) API key

### Backend Setup

```bash
cd csv-backend
python -m venv venv
venv\Scripts\activate           # Windows
# source venv/bin/activate      # macOS/Linux

pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

python manage.py migrate
python manage.py runserver
```

Backend runs at `http://localhost:8000`

### Frontend Setup

```bash
cd csv-frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Docker (Production)

```bash
# Build and run with Docker Compose
docker-compose up --build

# App available at http://localhost:8000
```

## Project Structure

```
csv-analyzer/
├── csv-backend/
│   ├── api/                    # Django app (models, views, serializers, utils)
│   ├── config/                 # Django settings, URLs, WSGI
│   ├── requirements.txt
│   └── .env.example
├── csv-frontend/
│   ├── src/
│   │   ├── components/         # Navbar, ChartView
│   │   ├── pages/              # Home, Report, Status
│   │   ├── api.js              # Axios API client
│   │   └── index.css           # Global styles (design system)
│   └── package.json
├── Dockerfile                  # Multi-stage build
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Method | Endpoint                         | Description                    |
|--------|----------------------------------|--------------------------------|
| POST   | `/api/upload/`                   | Upload a CSV file              |
| GET    | `/api/reports/`                  | List recent reports            |
| GET    | `/api/reports/<id>/`             | Get report details             |
| DELETE | `/api/reports/<id>/delete/`      | Delete a report                |
| POST   | `/api/reports/<id>/insights/`    | Generate AI insights           |
| POST   | `/api/reports/<id>/follow-up/`   | Ask a follow-up question       |
| GET    | `/api/health/`                   | System health check            |

## Environment Variables

| Variable           | Required | Default                        | Description             |
|--------------------|----------|--------------------------------|-------------------------|
| DJANGO_SECRET_KEY  | Yes      | (dev key)                      | Django secret key       |
| OPENROUTER_API_KEY | Yes      | —                              | OpenRouter API key      |
| DEBUG              | No       | True                           | Debug mode              |
| ALLOWED_HOSTS      | No       | *                              | Allowed hosts (CSV)     |
| OPENROUTER_MODEL   | No       | stepfun/step-3.5-flash:free    | LLM model to use       |

## Screenshots

[Add screenshots from your running application]

## Author

**Riya Shete** — [GitHub](https://github.com/riya-shete)
