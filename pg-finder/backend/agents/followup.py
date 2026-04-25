import json
import os
import difflib

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from agents.state import AgentState
from chroma_store import search_pgs

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.environ.get("GROQ_API_KEY"),
    temperature=0,
    max_tokens=512,
)

FOLLOWUP_SYSTEM = """
You are a PG search refinement agent. The user has already seen some PG results.
They want to refine, filter, or modify the search.

Extract refinement filters from the user message and return ONLY this JSON:
{
  "refined_query": "natural language query incorporating the refinement",
  "filters": {
    "area": "area name or null — keep existing if not changed",
    "max_price": <integer or null — lower if they said cheaper>,
    "gender": "Boys | Girls | Both | null",
    "food_included": true | false | null,
    "suitable_for": "Students | Working Professionals | null",
    "amenity_hint": "AC | WiFi | Gym | Parking | null — if user asked for specific amenity"
  }
}

Common refinement phrases:
- "cheaper / budget / lower price" → reduce max_price by 20%
- "show more / other options" → same filters, different results offset
- "with AC / WiFi / food" → add that to query
- "girls only / boys only" → update gender
- "near metro / quiet area" → update area hint in query

Respond ONLY with valid JSON.
"""

NOT_FOUND_MESSAGE = (
    "We did not find a PG in this area for your exact requirements yet. "
    "We are adding more and more sources in the future, so stay connected with us. "
    "Meanwhile, try searching in another nearby area."
)

AREA_ALIASES = {
    "Memnagar": ("memnagar", "gurukul", "memngr", "memnagr", "memna"),
    "Navrangpura": ("navrangpura", "navrang pura", "navrangpur", "navrang"),
    "Prahlad Nagar": ("prahlad nagar", "prahlad", "sg highway", "prahlad ngr"),
    "Satellite": ("satellite", "satelite", "sattelite", "satallite"),
    "Shivranjani": ("shivranjani", "shivranji", "shivrangani", "shivranjni"),
    "Thaltej": ("thaltej", "thaltaj", "thaltji"),
    "Vastrapur": ("vastrapur", "vasterpur", "vastpur", "vastrapr"),
    "Vijay Crossroads": ("vijay crossroads", "vijay cross roads", "vijay crossroad", "vijay cross"),
}


def _normalize_area(area: str | None) -> str | None:
    if not area:
        return None
    cleaned = area.strip().lower()
    
    # Exact match
    for canonical, aliases in AREA_ALIASES.items():
        if cleaned == canonical.lower() or any(alias in cleaned for alias in aliases):
            return canonical
            
    # Fuzzy match
    flat_aliases = {alias: canon for canon, aliases in AREA_ALIASES.items() for alias in [canon.lower()] + list(aliases)}
    match = difflib.get_close_matches(cleaned, flat_aliases.keys(), n=1, cutoff=0.7)
    if match:
        return flat_aliases[match[0]]
        
    return area.strip()


def _to_int_safe(value) -> int:
    try:
        if value is None:
            return 0
        if isinstance(value, str):
            cleaned = value.strip().lower()
            if cleaned in {"", "none", "null", "n/a", "na"}:
                return 0
        return int(value)
    except (TypeError, ValueError):
        return 0

def _to_float_safe(value) -> float:
    try:
        if value is None:
            return 0.0
        if isinstance(value, str):
            cleaned = value.strip().lower()
            if cleaned in {"", "none", "null", "n/a", "na"}:
                return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0

def _min_price(pg: dict) -> int:
    prices = [_to_int_safe(pg.get(k, 0)) for k in ("single_price", "double_price", "triple_price")]
    prices = [p for p in prices if p > 0]
    return min(prices) if prices else 0


def _apply_filters(chroma_results, filters, offset=0, limit=8):
    matched = []
    seen = 0
    for metadata in chroma_results.get("metadatas", [[]])[0]:
        pg = metadata

        if filters.get("area") and filters["area"].lower() not in pg.get("area", "").lower():
            continue

        max_price = _to_int_safe(filters.get("max_price"))
        if max_price > 0:
            prices = [_to_int_safe(pg.get(k, 0)) for k in ["single_price", "double_price", "triple_price"]]
            prices = [p for p in prices if p > 0]
            if not prices or min(prices) > max_price:
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

        seen += 1
        if seen <= offset:
            continue

        matched.append(pg)
        if limit is not None and len(matched) >= limit:
            break

    return matched


def followup_node(state: AgentState) -> AgentState:
    msg = state["user_message"].lower().strip()
    session = dict(state.get("session_data", {}) or {})
    
    awaiting = session.pop("_awaiting_followup", None)
    
    if not awaiting:
        if msg in ("change budget", "change price"):
            session["_awaiting_followup"] = "budget"
            return {
                **state,
                "session_data": session,
                "response_mode": "question",
                "response_message": "What is your new budget? You can choose one below or type an amount.",
                "quick_replies": ["Under ₹8,000", "₹8,000 – ₹12,000", "₹12,000 – ₹15,000", "₹15,000+"],
                "pgs": [],
                "pg_count": 0,
            }
            
        if msg in ("change rating", "change ratings"):
            session["_awaiting_followup"] = "rating"
            return {
                **state,
                "session_data": session,
                "response_mode": "question",
                "response_message": "What minimum rating are you looking for?",
                "quick_replies": ["4.5+ ⭐", "4.0+ ⭐", "3.5+ ⭐", "Any rating"],
                "pgs": [],
                "pg_count": 0,
            }
            
        if msg in ("change area", "different area"):
            session["_awaiting_followup"] = "area"
            return {
                **state,
                "session_data": session,
                "response_mode": "question",
                "response_message": "Which area would you like to search in?",
                "quick_replies": ["Memnagar", "Navrangpura", "Prahlad Nagar", "Satellite", "Shivranjani", "Thaltej", "Vastrapur", "Vijay Crossroads"],
                "pgs": [],
                "pg_count": 0,
            }

    is_show_more = "more" in state["user_message"].lower()

    is_sort_price = msg in ("sort by lowest price", "lowest price", "cheapest")
    is_sort_rating = msg in ("sort by top rated", "top rated", "highest rating")

    if is_show_more or is_sort_price or is_sort_rating:
        filters = session.get("_last_filters", {})
        query = session.get("_last_query", state["user_message"])
    else:
        context = (
            f"User message: {state['user_message']}\n"
            f"Previous PGs shown: {state.get('pg_count', 0)}\n"
            "Previous search context from conversation."
        )

        messages = [SystemMessage(content=FOLLOWUP_SYSTEM), HumanMessage(content=context)]
        raw = llm.invoke(messages).content.strip()

        try:
            if raw.startswith("```"):
                raw = raw.split("```")[1].lstrip("json").strip()
            extracted = json.loads(raw)
        except Exception:
            extracted = {"refined_query": state["user_message"], "filters": {}}

        query = extracted.get("refined_query", state["user_message"])
        filters = extracted.get("filters", {})
        
        # Apply fuzzy normalization to the extracted area
        if filters.get("area"):
            normalized_area = _normalize_area(filters["area"])
            if normalized_area:
                filters["area"] = normalized_area
                
        amenity = filters.get("amenity_hint")
        if amenity:
            query += f" with {amenity}"
            
        session["_last_filters"] = filters
        session["_last_query"] = query

    # If it's a 'show more' request, we pull a large number of results and don't limit them.
    # We display them all together without an offset so the user sees the full matching set.
    n_results = 60 if is_show_more else 20
    limit = None if is_show_more else 8
    offset = 0

    chroma_results = search_pgs(query, n_results=n_results)
    matched = _apply_filters(chroma_results, filters, offset=offset, limit=limit)

    if is_sort_price:
        matched.sort(key=lambda pg: _min_price(pg) or 999999)
    elif is_sort_rating:
        matched.sort(key=lambda pg: _to_float_safe(pg.get("rating")), reverse=True)

    if matched:
        msg = f"Here are {len(matched)} results based on your preferences:"
        if is_sort_price or is_sort_rating:
            msg = "Here are the top results prioritized heavily based on your requested sort:"
        quick_replies = ["Sort by Lowest Price", "Sort by Top Rated", "Change budget", "Start fresh"]
    else:
        msg = NOT_FOUND_MESSAGE
        quick_replies = ["Remove price filter", "Try different area", "Start over"]

    session["_last_results"] = [{"id": pg.get("id", ""), "name": pg.get("name", "")} for pg in matched]
    session["_last_results_details"] = [pg.get("_doc", "") for pg in matched[:4]]

    return {
        **state,
        "session_data": session,
        "response_mode": "results",
        "response_message": msg,
        "quick_replies": quick_replies,
        "pgs": matched,
        "pg_count": len(matched),
    }
