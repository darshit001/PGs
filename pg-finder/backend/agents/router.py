import json
import os
import re
import difflib

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from agents.state import AgentState

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.environ.get("GROQ_API_KEY"),
    temperature=0,
    max_tokens=256,
)

ROUTER_SYSTEM = """
You are the intent classifier for PG Finder Ahmedabad chatbot.

Classify the user's message into exactly ONE of these intents:

1. "greeting"   — User says hi, hello, namaste, who are you, what can you do, thanks
2. "search"     — User typed a direct PG query with location/budget/filters (NOT from a button)
3. "guided"     — User clicked a button option (message_source is "button")
4. "followup"   — User is refining previous results: "cheaper", "show more", "with food", "near metro"
5. "qna"        — General question about PGs, Ahmedabad areas, what amenities mean, deposit rules, etc.
6. "qna_and_search" — User asks a general question AND requests for PGs in the same message.

Rules:
- If message_source is "button" and it is a guided-step answer, return "guided"
- If the message contains a price (like "10K", "8000", "₹12000") + a location, return "search"
- If previous results exist in context and user is modifying (more, cheaper, different area), return "followup"
- If user says generic search starters like "find me a pg" or "i need a pg", return "guided"
- When in doubt between "search" and "guided", prefer "search"
- If user asks a question (like "What is a deposit?") AND also wants to "find a PG in Thaltej", return "qna_and_search"

Respond with ONLY a valid JSON object, nothing else:
{"intent": "<one of the 6 intents above>"}
"""

AREA_TERMS = (
    "memnagar",
    "memngr",
    "memnagr",
    "gurukul",
    "navrangpura",
    "navrang pura",
    "navrangpur",
    "prahlad nagar",
    "prahlad",
    "shivranjani",
    "shivranji",
    "shivrangani",
    "satellite",
    "satelite",
    "sattelite",
    "thaltej",
    "vastrapur",
    "vasterpur",
    "vastpur",
    "vijay crossroads",
    "vijay cross roads",
    "vijay crossroad",
    "sg highway",
)

GUIDED_BUTTON_VALUES = {
    "find me a pg",
    "i need a pg",
    "need a pg",
    "help me find a pg",
    "start search",
    "start over",
    "memnagar",
    "pg in memnagar",
    "navrangpura",
    "pg in navrangpura",
    "prahlad nagar",
    "pg in prahlad nagar",
    "satellite",
    "pg in satellite",
    "shivranjani",
    "pg in shivranjani",
    "thaltej",
    "pg in thaltej",
    "vastrapur",
    "pg in vastrapur",
    "vijay crossroads",
    "pg in vijay crossroads",
    "under ₹8,000",
    "₹8,000 – ₹12,000",
    "₹12,000 – ₹15,000",
    "₹15,000+",
    "under 8k",
    "8k-12k",
    "12k-15k",
    "boys",
    "girls",
    "both",
    "4.5+ ⭐",
    "4.0+ ⭐",
    "3.5+ ⭐",
    "any rating",
}

FOLLOWUP_HINTS = (
    "show me more",
    "show more",
    "more options",
    "cheaper",
    "lower price",
    "budget",
    "with ac",
    "with wifi",
    "with food",
    "different area",
    "change area",
    "filter",
    "change budget",
    "change rating",
    "sort by",
    "lowest price",
    "top rated",
    "cheapest",
)

GREETING_HINTS = ("hi", "hello", "hey", "namaste", "thanks", "thank you")
GENDER_HINTS = ("boy", "boys", "girl", "girls", "ladies", "female", "gents", "male", "both")
RATING_HINTS = ("rating", "star", "stars", "⭐", "4.5", "4.0", "3.5")
FOOD_HINTS = ("food", "meal", "breakfast", "lunch", "dinner", "tiffin")


def _fuzzy_has_area(text: str) -> bool:
    lowered = text.lower()
    if any(area in lowered for area in AREA_TERMS):
        return True
        
    words = lowered.split()
    bigrams = [" ".join(words[i:i+2]) for i in range(len(words)-1)]
    candidates = words + bigrams
    
    for cand in candidates:
        if difflib.get_close_matches(cand, AREA_TERMS, n=1, cutoff=0.7):
            return True
            
    return False


def _likely_guided_starter(msg: str) -> bool:
    text = msg.lower().strip()
    has_area = _fuzzy_has_area(text)
    if has_area:
        return False

    starters = (
        "find me a pg",
        "i need a pg",
        "need a pg",
        "help me find a pg",
        "show pg",
        "start search",
    )
    return any(s in text for s in starters)


def _likely_search(msg: str) -> bool:
    text = msg.lower()
    has_price = bool(re.search(r"(?:₹\s*)?\d{3,5}|\b\d{1,2}\s*k\b|under\s*\d", text))
    has_area = _fuzzy_has_area(text)
    has_pg_intent = any(token in text for token in ("pg", "paying guest", "hostel", "accommodation"))
    has_gender = any(token in text for token in GENDER_HINTS)
    has_rating = any(token in text for token in RATING_HINTS)
    has_food = any(token in text for token in FOOD_HINTS)
    return has_area and has_pg_intent and (has_price or has_gender or has_rating or has_food)


def _is_partial_area_request(msg: str) -> bool:
    text = msg.lower().strip()
    has_area = _fuzzy_has_area(text)
    has_pg_intent = any(token in text for token in ("pg", "paying guest", "hostel", "accommodation"))
    if not (has_area and has_pg_intent):
        return False
    has_strong_filter = bool(re.search(r"(?:₹\s*)?\d{3,5}|\b\d{1,2}\s*k\b|under\s*\d", text)) or any(
        token in text for token in (*GENDER_HINTS, *RATING_HINTS, *FOOD_HINTS)
    )
    return not has_strong_filter


def _likely_followup(msg: str, has_previous_results: bool) -> bool:
    if not has_previous_results:
        return False
    text = msg.lower().strip()
    return any(token in text for token in FOLLOWUP_HINTS)


def _likely_greeting(msg: str) -> bool:
    text = msg.lower().strip()
    return any(text == token or text.startswith(token + " ") for token in GREETING_HINTS)


def _likely_qna(msg: str) -> bool:
    text = msg.lower().strip()
    has_qna_prefix = any(
        text.startswith(prefix) or prefix in text
        for prefix in ("what is", "how", "why", "can i", "is it", "are there", "difference between", "tell me about")
    )
    if not has_qna_prefix and "?" not in text:
        return False
        
    has_search = _fuzzy_has_area(text) or any(token in text for token in ("find", "show", "need", "looking"))
    return "qna_and_search" if has_search else "qna"


def _button_should_use_guided(msg: str, state: AgentState) -> bool:
    session = state.get("session_data", {}) or {}
    if session.get("_last_asked"):
        return True
    return msg.lower().strip() in GUIDED_BUTTON_VALUES


def router_node(state: AgentState) -> AgentState:
    msg = state["user_message"]
    source = state.get("message_source", "typed")
    has_previous_results = (state.get("pg_count", 0) or 0) > 0
    session = state.get("session_data", {}) or {}

    if session.get("_awaiting_followup"):
        return {**state, "intent": "followup"}

    # If guided flow is in progress, keep routing all answers to guided.
    if session.get("_last_asked"):
        return {**state, "intent": "guided"}

    if source == "button":
        if _button_should_use_guided(msg, state):
            return {**state, "intent": "guided"}
        if _likely_followup(msg, has_previous_results):
            return {**state, "intent": "followup"}
        if _likely_search(msg):
            return {**state, "intent": "search"}
        if _likely_greeting(msg):
            return {**state, "intent": "greeting"}
            
        qna_check = _likely_qna(msg)
        if qna_check:
            return {**state, "intent": qna_check}
            
        if _fuzzy_has_area(msg):
            return {**state, "intent": "search"}
        # For suggestion chips like "Try Prahlad Nagar", default to search (not guided reset).
        return {**state, "intent": "search"}

    if _likely_guided_starter(msg):
        return {**state, "intent": "guided"}

    if _is_partial_area_request(msg):
        return {**state, "intent": "guided"}

    if _likely_followup(msg, has_previous_results):
        return {**state, "intent": "followup"}

    qna_check = _likely_qna(msg)
    if qna_check:
        return {**state, "intent": qna_check}

    if _likely_search(msg):
        return {**state, "intent": "search"}

    if _likely_greeting(msg):
        return {**state, "intent": "greeting"}

    messages = [
        SystemMessage(content=ROUTER_SYSTEM),
        HumanMessage(
            content=(
                f"Message: {msg}\n"
                f"History length: {len(state.get('conversation_history', []))}\n"
                f"Previous results shown: {has_previous_results}\n"
                f"message_source: {source}"
            )
        ),
    ]

    raw = llm.invoke(messages).content.strip()

    try:
        if raw.startswith("```"):
            raw = raw.split("```")[1].lstrip("json").strip()
        result = json.loads(raw)
        intent = result.get("intent", "qna")
    except Exception:
        intent = "qna"

    if intent not in {"greeting", "search", "guided", "followup", "qna", "qna_and_search"}:
        intent = "qna"

    return {**state, "intent": intent}
