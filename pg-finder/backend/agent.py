import json
import os
import re
from typing import Any, Literal, TypedDict

from dotenv import load_dotenv
from groq import Groq
from langgraph.graph import END, START, StateGraph

from chroma_store import search_pgs

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

GREETING_PROMPT = """
You are StayEase AI, a warm assistant for PG search in Ahmedabad.

Reply ONLY as valid JSON in this format:
{
  "mode": "question",
  "message": "friendly response",
  "quick_replies": ["option1", "option2", "option3"]
}

Use this mode for greetings and light small talk while gently moving the user to PG search.
"""

QUERY_PROMPT = """
You are StayEase AI, a PG search planner for Ahmedabad.

User likely gave an explicit search query.

Return ONLY valid JSON in one of these formats.

If you have enough info (minimum: location + budget intent):
{
  "mode": "search",`
  "query": "natural language query for vector search",
  "filters": {
    "area": "area name or null",
    "max_price": number or null,
    "gender": "Boys/Girls/Both or null",
    "food_included": true/false or null,
    "suitable_for": "Students/Working Professionals or null"
  }
}

If still missing critical details:
{
  "mode": "question",
  "message": "your follow-up question",
  "quick_replies": ["option1", "option2", "option3"]
}
"""

FOLLOW_UP_PROMPT = """
You are StayEase AI, a guided PG search assistant for Ahmedabad.

The user message may come from a quick-reply button and should be treated as the answer to your last question.
Ask ONE focused question at a time if needed.

Return ONLY valid JSON in one of these formats.

If enough info is collected (minimum: location + budget intent):
{
  "mode": "search",
  "query": "natural language query for vector search",
  "filters": {
    "area": "area name or null",
    "max_price": number or null,
    "gender": "Boys/Girls/Both or null",
    "food_included": true/false or null,
    "suitable_for": "Students/Working Professionals or null"
  }
}

If still collecting details:
{
  "mode": "question",
  "message": "your next targeted question",
  "quick_replies": ["option1", "option2", "option3"]
}
"""

INTENT_PROMPT = """
Classify the latest user message into exactly one intent.

Valid intents:
- greeting: greetings/small talk like hello, hi, how are you, thanks, who are you.
- query: user explicitly asks for PG search results.
- follow_up: user is answering prior assistant questions (often short reply or button selection).

Return ONLY valid JSON:
{
  "intent": "greeting|query|follow_up"
}
"""

DEFAULT_FALLBACK = {
    "mode": "question",
    "message": "Could you share which area in Ahmedabad you prefer for your PG search?",
    "quick_replies": ["Memnagar", "Shivranjani", "Prahlad Nagar", "Parsana Nagar"],
}


class AgentState(TypedDict, total=False):
    conversation_history: list[dict[str, Any]]
    latest_user_text: str
    latest_user_source: str
    intent: Literal["greeting", "query", "follow_up"]
    result: dict[str, Any]


def _parse_json_response(raw: str) -> dict[str, Any]:
    cleaned = (raw or "").strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        if len(parts) > 1:
            cleaned = parts[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
    return json.loads(cleaned.strip())


def _latest_user_payload(conversation_history: list[dict[str, Any]]) -> tuple[str, str]:
    for message in reversed(conversation_history):
        if message.get("role") == "user":
            return (message.get("content") or "").strip(), (message.get("source") or "text").strip()
    return "", "text"


def _contains_search_keywords(text: str) -> bool:
    lowered = text.lower()
    keywords = (
        "pg",
        "rent",
        "budget",
        "under",
        "sharing",
        "memnagar",
        "shivranjani",
        "prahlad",
        "parsana",
        "girls",
        "boys",
        "food",
        "near",
    )
    return any(k in lowered for k in keywords)


def _looks_like_small_talk(text: str) -> bool:
    compact = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    compact = re.sub(r"\s+", " ", compact).strip()
    if not compact:
        return False

    if _contains_search_keywords(compact):
        return False

    greetings = (
        "hi",
        "hello",
        "hey",
        "namaste",
        "good morning",
        "good afternoon",
        "good evening",
        "how are you",
        "thanks",
        "thank you",
        "who are you",
        "what can you do",
    )
    return compact in greetings or any(compact.startswith(g + " ") for g in greetings)


def _llm_json(system_prompt: str, conversation_history: list[dict[str, Any]], temperature: float = 0.2) -> dict[str, Any]:
    # Only pass role/content to the chat API.
    messages = [{"role": "system", "content": system_prompt}] + [
        {"role": m.get("role"), "content": m.get("content", "")} for m in conversation_history
    ]

    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=messages,
        temperature=temperature,
        max_completion_tokens=1024,
        top_p=1,
        stream=False,
        stop=None,
    )

    raw = completion.choices[0].message.content or ""
    return _parse_json_response(raw)


def _coerce_price(value: str | None) -> int:
    try:
        parsed = int(value or 0)
        return parsed if parsed > 0 else 999999
    except (TypeError, ValueError):
        return 999999


def _resolve_search(result: dict[str, Any]) -> dict[str, Any]:
    if result.get("mode") != "search":
        return {
            "mode": "question",
            "message": result.get("message") or DEFAULT_FALLBACK["message"],
            "quick_replies": result.get("quick_replies") or DEFAULT_FALLBACK["quick_replies"],
        }

    chroma_results = search_pgs(result.get("query", "PG in Ahmedabad"), n_results=15)
    filters = result.get("filters", {}) or {}

    matched_pgs = []
    for pg in chroma_results.get("metadatas", [[]])[0]:
        if filters.get("area") and filters["area"].lower() not in pg.get("area", "").lower():
            continue

        if filters.get("max_price"):
            min_price = min(
                _coerce_price(pg.get("single_price")),
                _coerce_price(pg.get("double_price")),
                _coerce_price(pg.get("triple_price")),
            )
            if min_price > int(filters["max_price"]):
                continue

        if filters.get("gender") and filters["gender"] != "Both":
            if pg.get("gender") not in [filters["gender"], "Both"]:
                continue

        if filters.get("food_included") is not None:
            pg_food = pg.get("food_included", "False") == "True"
            if pg_food != filters["food_included"]:
                continue

        if filters.get("suitable_for"):
            if filters["suitable_for"].lower() not in pg.get("suitable_for", "").lower():
                continue

        matched_pgs.append(pg)
        if len(matched_pgs) >= 5:
            break

    return {"mode": "results", "pgs": matched_pgs, "count": len(matched_pgs)}


def _router_node(state: AgentState) -> AgentState:
    user_text = state.get("latest_user_text", "")
    user_source = (state.get("latest_user_source") or "text").lower()

    if user_source == "quick_reply":
        return {"intent": "follow_up"}

    if _looks_like_small_talk(user_text):
        return {"intent": "greeting"}

    try:
        intent_result = _llm_json(INTENT_PROMPT, state.get("conversation_history", []), temperature=0)
        intent = intent_result.get("intent", "query")
        if intent not in {"greeting", "query", "follow_up"}:
            intent = "query"
        return {"intent": intent}
    except Exception:
        return {"intent": "query"}


def _greeting_node(state: AgentState) -> AgentState:
    try:
        response = _llm_json(GREETING_PROMPT, state.get("conversation_history", []), temperature=0.5)
        if response.get("mode") != "question":
            response = {
                "mode": "question",
                "message": "Hello! How can I help you find a PG in Ahmedabad today?",
                "quick_replies": ["Memnagar", "Shivranjani", "Prahlad Nagar"],
            }
    except Exception:
        response = {
            "mode": "question",
            "message": "Hello! How can I help you find a PG in Ahmedabad today?",
            "quick_replies": ["Memnagar", "Shivranjani", "Prahlad Nagar"],
        }
    return {"result": response}


def _query_node(state: AgentState) -> AgentState:
    try:
        planner = _llm_json(QUERY_PROMPT, state.get("conversation_history", []), temperature=0.2)
    except Exception:
        planner = DEFAULT_FALLBACK
    return {"result": _resolve_search(planner)}


def _follow_up_node(state: AgentState) -> AgentState:
    try:
        planner = _llm_json(FOLLOW_UP_PROMPT, state.get("conversation_history", []), temperature=0.2)
    except Exception:
        planner = DEFAULT_FALLBACK
    return {"result": _resolve_search(planner)}


def _route_intent(state: AgentState) -> Literal["greeting", "query", "follow_up"]:
    intent = state.get("intent", "query")
    if intent in {"greeting", "query", "follow_up"}:
        return intent
    return "query"


def _build_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("router", _router_node)
    workflow.add_node("greeting", _greeting_node)
    workflow.add_node("query", _query_node)
    workflow.add_node("follow_up", _follow_up_node)

    workflow.add_edge(START, "router")
    workflow.add_conditional_edges(
        "router",
        _route_intent,
        {
            "greeting": "greeting",
            "query": "query",
            "follow_up": "follow_up",
        },
    )
    workflow.add_edge("greeting", END)
    workflow.add_edge("query", END)
    workflow.add_edge("follow_up", END)

    return workflow.compile()


AGENT_GRAPH = _build_graph()


def run_agent(conversation_history: list[dict[str, Any]]) -> dict[str, Any]:
    latest_user_text, latest_user_source = _latest_user_payload(conversation_history)
    state: AgentState = {
        "conversation_history": conversation_history,
        "latest_user_text": latest_user_text,
        "latest_user_source": latest_user_source or "text",
    }

    try:
        result_state = AGENT_GRAPH.invoke(state)
        result = result_state.get("result") if isinstance(result_state, dict) else None
        if isinstance(result, dict) and result.get("mode") in {"question", "results"}:
            return result
    except Exception:
        pass

    return DEFAULT_FALLBACK
