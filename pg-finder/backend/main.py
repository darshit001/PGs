from typing import List, Optional

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agents import pg_graph

app = FastAPI(title="PG Finder API — LangGraph Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    message_source: Optional[str] = "typed"  # "typed" | "button"
    session_data: Optional[dict] = Field(default_factory=dict)
    pg_count: Optional[int] = 0


@app.get("/health")
def health():
    return {"status": "ok", "agent": "langgraph"}


@app.post("/chat")
def chat(request: ChatRequest):
    history = [{"role": m.role, "content": m.content} for m in request.messages]
    user_message = history[-1]["content"] if history else ""

    initial_state = {
        "user_message": user_message,
        "message_source": request.message_source or "typed",
        "conversation_history": history[:-1],
        "session_data": request.session_data or {},
        "intent": "",
        "response_mode": "",
        "response_message": "",
        "quick_replies": [],
        "pgs": [],
        "pg_count": request.pg_count or 0,
    }

    final_state = pg_graph.invoke(initial_state)

    return {
        "mode": final_state["response_mode"],
        "intent": final_state["intent"],
        "message": final_state["response_message"],
        "quick_replies": final_state["quick_replies"],
        "pgs": final_state["pgs"],
        "count": final_state["pg_count"],
        "session_data": final_state.get("session_data", {}),
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
