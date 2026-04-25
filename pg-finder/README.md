# PG Finder Ahmedabad

Full-stack Agentic AI chatbot to help users find PG accommodations in Ahmedabad.

## Tech Stack

- Frontend: React 18 + Vite + Tailwind CSS v3
- Backend: FastAPI + Uvicorn
- Vector DB: ChromaDB (persistent local)
- Orchestration: LangGraph multi-agent system
- LLM: Groq via LangChain (`llama-3.3-70b-versatile`)
- Data: `backend/pg_data.json`

## Project Structure

```text
pg-finder/
├── backend/
│   ├── main.py
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── graph.py
│   │   ├── state.py
│   │   ├── router.py
│   │   ├── greeting.py
│   │   ├── search.py
│   │   ├── guided.py
│   │   ├── followup.py
│   │   └── qna.py
│   ├── chroma_store.py
│   ├── seed_data.py
│   ├── pg_data.json
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── PGCard.jsx
│   │   │   ├── QuickReplyButtons.jsx
│   │   │   └── TypingIndicator.jsx
│   │   ├── hooks/
│   │   │   └── useChat.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed_data.py
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## API Endpoints

- `GET /health`
- `POST /chat`

`POST /chat` body:

```json
{
  "messages": [
    { "role": "user", "content": "PG near Memnagar under 10K for girls with food" }
  ],
  "message_source": "typed",
  "session_data": {},
  "pg_count": 0
}
```

## Notes

- Run `seed_data.py` once before first chat request.
- Chroma data persists in `backend/chroma_db/`.
- Keep `backend/.env` private.
