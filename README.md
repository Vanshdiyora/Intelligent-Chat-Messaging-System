# Intelligent Chat Messaging System

A WhatsApp-like real-time chat application with integrated machine learning features including smart replies, toxicity detection, and chat summarization.

## Architecture

```
┌─────────────┐    WebSocket/HTTP     ┌──────────────┐     SQLAlchemy      ┌──────────┐
│   React UI  │ ◄──────────────────► │   FastAPI     │ ◄────────────────► │  SQLite/  │
│  (Vite +    │                       │   Backend     │                    │  Postgres │
│  Tailwind)  │                       │               │                    └──────────┘
│  Redux TK   │                       │  ┌──────────┐ │
└─────────────┘                       │  │AI Service│ │
                                      │  └─────┬────┘ │
                                      └────────┼──────┘
                                               │
                                      ┌────────▼──────┐
                                      │  AI Models    │
                                      │  - SmartReply │
                                      │  - Toxicity   │
                                      │  - Summarizer │
                                      └───────────────┘
```

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React (Vite), Tailwind CSS, Redux TK|
| Backend     | Python, FastAPI, WebSockets, JWT    |
| Database    | SQLite (dev) / PostgreSQL (prod)    |
| ML/AI       | PyTorch, custom-trained models      |
| Deployment  | Render (backend), Vercel (frontend) |

## Project Structure

```
├── backend/          # FastAPI backend (modular services)
├── frontend/         # React frontend (modular UI)
├── ai/               # All ML models (separate modules)
├── notebooks/        # Jupyter/Colab notebooks for training
├── shared/           # Shared configs, constants, utilities
├── scripts/          # Utility scripts (data prep, migrations)
├── tests/            # Unit and integration tests
├── docker/           # Docker configs
├── .env.example
└── README.md
```

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip / npm

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### AI Models
Train models using notebooks in `notebooks/` (Google Colab compatible).
Place saved models in `ai/saved_models/`.

## ML Features

### 1. Smart Replies
- Seq2Seq LSTM model trained on conversational data
- Suggests 2-3 contextual reply options
- Training notebook: `notebooks/smart_reply_training.ipynb`

### 2. Toxicity Detection
- LSTM text classifier trained on Jigsaw Toxic Comment dataset
- Flags toxic messages with confidence scores
- Training notebook: `notebooks/toxicity_training.ipynb`

### 3. Chat Summarization
- Extractive summarization using TextRank + ML scoring
- Summarizes long conversation threads
- Training notebook: `notebooks/summarization_training.ipynb`

## Deployment

See the [Deployment Guide](docs/DEPLOYMENT.md) for step-by-step instructions.

## License

MIT
