# Intelligent Chat Messaging System

A real-time chat application with integrated AI/ML features — smart replies, toxicity detection, and chat summarization. Built with React, FastAPI, WebSockets, and PyTorch.

## Live Demo

- **Frontend:** Deployed on Vercel
- **Backend:** Deployed on Render — `https://intelligent-chat-messaging-system.onrender.com`

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

| Layer       | Technology                                              |
|-------------|---------------------------------------------------------|
| Frontend    | React 18, Vite 5, Tailwind CSS 3.4, Redux Toolkit, React Router 6 |
| Backend     | Python 3.11, FastAPI 0.104, SQLAlchemy 2.0, WebSockets, JWT |
| Database    | SQLite (dev) / PostgreSQL via Neon (prod)               |
| AI/ML       | PyTorch 2.6 (CPU), NLTK, custom Seq2Seq & LSTM models  |
| Deployment  | Render (backend), Vercel (frontend)                     |

## Project Structure

```
├── ai/                      # AI/ML models
│   ├── smart_reply/         # Seq2Seq encoder-decoder for reply generation
│   │   ├── model/           # Seq2Seq model definition
│   │   ├── inference/       # Prediction / generation logic
│   │   └── utils/           # Vocabulary helpers
│   ├── toxicity/            # LSTM classifier for toxic content
│   │   ├── model/           # LSTM classifier definition
│   │   ├── inference/       # Prediction logic
│   │   └── utils/           # Vocabulary helpers
│   ├── summarization/       # TextRank extractive summarizer
│   │   ├── model/           # TextRank algorithm
│   │   └── inference/       # Prediction logic
│   ├── common/              # Shared preprocessing & evaluation metrics
│   └── saved_models/        # Trained model weights & vocab files
├── backend/                 # FastAPI backend
│   └── app/
│       ├── main.py          # App entry point, CORS, startup
│       ├── api/             # Route handlers (auth, chat, ai)
│       ├── core/            # Config, security (JWT)
│       ├── db/              # Database session setup
│       ├── models/          # SQLAlchemy ORM models
│       ├── schemas/         # Pydantic request/response schemas
│       ├── services/        # Business logic (chat, AI, user)
│       └── websockets/      # WebSocket connection manager & handlers
├── frontend/                # React SPA
│   └── src/
│       ├── app/             # Redux store configuration
│       ├── components/      # Reusable UI components
│       ├── features/        # Feature modules (auth, chat, ai slices)
│       ├── hooks/           # Custom hooks (useWebSocket)
│       ├── pages/           # Page components (Login, Register, Chat)
│       ├── services/        # API client & WebSocket client
│       └── styles/          # Tailwind entry CSS
├── notebooks/               # Training notebooks (Kaggle/Colab compatible)
├── shared/                  # Shared constants
├── render.yaml              # Render deployment config
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Clone & Configure

```bash
git clone <repo-url>
cd "Intelligent Chat Messaging System"
```

Create a `.env` file in the project root:

```env
DATABASE_URL=sqlite:///./chat.db
SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:5173
MODEL_DIR=ai/saved_models
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### 4. AI Models (Optional)

The app works without trained models — rule-based fallbacks are used automatically. To use the ML models:

1. Train models using notebooks in `notebooks/` (Kaggle or Google Colab).
2. Place the exported files in `ai/saved_models/`:
   - `ai/saved_models/smart_reply/model.pt` and `vocab.json`
   - `ai/saved_models/toxicity/model.pt` and `vocab.json`

## Features

### Real-Time Messaging
- WebSocket-based instant messaging
- Online/offline user status indicators
- Typing-aware smart reply suggestions
- Unread message counts (persisted server-side)

### Mobile Responsive
- Fully responsive layout with sidebar/chat toggle on mobile
- Dynamic viewport height handling for mobile browsers

### AI/ML Integration

#### Smart Replies
- **Model:** Seq2Seq LSTM encoder-decoder
- **Dataset:** DailyDialog (HuggingFace)
- **Function:** Suggests 3 contextual reply options based on recent messages
- **Fallback:** Rule-based pattern matching when model is unavailable
- **Training:** `notebooks/smart_reply_training.ipynb`

#### Toxicity Detection
- **Model:** LSTM text classifier
- **Dataset:** Jigsaw Toxic Comment dataset
- **Function:** Flags toxic messages with confidence scores (threshold: 0.7)
- **Fallback:** Keyword-based detection
- **Training:** `notebooks/toxicity_training.ipynb`

#### Chat Summarization
- **Model:** TextRank extractive summarization
- **Function:** Summarizes long conversation threads into key sentences
- **Fallback:** Returns the most recent messages
- **Notebook:** `notebooks/summarization_textrank.ipynb`

### Authentication
- JWT-based authentication with bcrypt password hashing
- Token stored in localStorage, auto-attached to API requests
- Protected routes with automatic redirect

## API Endpoints

### Auth
| Method | Endpoint            | Description       |
|--------|---------------------|-------------------|
| POST   | `/api/auth/register`| Register new user |
| POST   | `/api/auth/login`   | Login & get JWT   |
| GET    | `/api/auth/me`      | Get current user  |

### Chat
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | `/api/chat/conversations`         | List user conversations  |
| POST   | `/api/chat/conversations`         | Create new conversation  |
| GET    | `/api/chat/conversations/{id}/messages` | Get messages       |
| POST   | `/api/chat/conversations/{id}/messages` | Send a message     |

### AI
| Method | Endpoint              | Description            |
|--------|-----------------------|------------------------|
| POST   | `/api/ai/smart-reply` | Get smart reply suggestions |
| POST   | `/api/ai/toxicity`    | Check text toxicity    |
| POST   | `/api/ai/summarize`   | Summarize messages     |

### WebSocket
| Endpoint       | Description                   |
|----------------|-------------------------------|
| `/ws/{token}`  | Real-time messaging connection|

**WebSocket Events:** `new_message`, `new_conversation`, `user_online`, `user_offline`

## Deployment

### Backend (Render)

The `render.yaml` is pre-configured. Connect the repo to Render and set these environment variables:

| Variable       | Value                                    |
|----------------|------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Neon) |
| `SECRET_KEY`   | Random secret for JWT signing            |
| `FRONTEND_URL` | Your Vercel frontend URL                 |
| `MODEL_DIR`    | `/opt/render/project/src/ai/saved_models`|

### Frontend (Vercel)

1. Import the repo on Vercel
2. Set root directory to `frontend`
3. Set environment variables:
   - `VITE_API_URL` = `https://<your-render-app>.onrender.com/api`
   - `VITE_WS_URL` = `wss://<your-render-app>.onrender.com`

## License

MIT
