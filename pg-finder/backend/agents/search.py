import json
import os
import re
import difflib

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from qdrant_client.http import models

from agents.state import AgentState
from chroma_store import search_pgs

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.environ.get("GROQ_API_KEY"),
    temperature=0,
    max_tokens=512,
)

SEARCH_SYSTEM = """
You are a filter extractor for a PG finder system in Ahmedabad.

Extract search filters from the user's message and return ONLY this JSON:
{
  "query": "full natural language query for vector search",
  "filters": {
    "area": "Memnagar | Navrangpura | Prahlad Nagar | Satellite | Shivranjani | Thaltej | Vastrapur | Vijay Crossroads | null",
    "max_price": <integer in INR or null>,
    "gender": "Boys | Girls | Both | null",
    "food_included": true | false | null,
    "suitable_for": "Students | Working Professionals | null"
  }
}

Price rules:
- "under 10K" → max_price: 10000
- "8-12K" → max_price: 12000
- "budget" or "cheap" → max_price: 8000

Area rules (map shortforms):
- "memnagar", "gurukul" → "Memnagar"
- "navrangpura" → "Navrangpura"
- "prahlad nagar", "sg highway" → "Prahlad Nagar"
- "satellite" → "Satellite"
- "shivranjani" → "Shivranjani"
- "thaltej" → "Thaltej"
- "vastrapur" → "Vastrapur"
- "vijay crossroads" → "Vijay Crossroads"

Gender rules:
- "for girls", "ladies", "female" → "Girls"
- "for boys", "gents", "male" → "Boys"

Respond ONLY with valid JSON. No explanation.
"""

NOT_FOUND_MESSAGE = (
    "We did not find a PG in this area for your exact requirements yet. "
    "We are adding more and more sources in the future, so stay connected with us. "
    "Meanwhile, try searching in another nearby area."
)

AREA_CLUSTERS = [
    ("Memnagar", "Vastrapur", "Navrangpura", "Vijay Crossroads"),
    ("Satellite", "Prahlad Nagar", "Shivranjani"),
    ("Thaltej", "Memnagar", "Vastrapur")
]

def _get_nearby_areas(area: str):
    if not area:
        return ["Navrangpura", "Satellite"]
    for cluster in AREA_CLUSTERS:
        if area in cluster:
            return [a for a in cluster if a != area][:2]
    return ["Navrangpura", "Satellite"]

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

PRICE_PATTERN = re.compile(r"(?:₹\s*)?\d{3,5}|\b\d{1,2}\s*k\b|under\s*\d|\bbudget\b|\bcheap")


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


def _detect_area_from_text(text: str) -> str | None:
    lowered = text.lower()
    
    # Exact match
    for canonical, aliases in AREA_ALIASES.items():
        if canonical.lower() in lowered or any(alias in lowered for alias in aliases):
            return canonical
            
    # Fuzzy match
    words = lowered.split()
    bigrams = [" ".join(words[i:i+2]) for i in range(len(words)-1)]
    candidates = words + bigrams
    
    flat_aliases = {alias: canon for canon, aliases in AREA_ALIASES.items() for alias in [canon.lower()] + list(aliases)}
    
    for cand in candidates:
        match = difflib.get_close_matches(cand, flat_aliases.keys(), n=1, cutoff=0.7)
        if match:
            return flat_aliases[match[0]]
            
    return None


def _area_matches(filter_area: str, pg_area: str) -> bool:
    if not filter_area:
        return True
    fa = filter_area.lower().strip()
    pa = (pg_area or "").lower().strip()
    if not pa:
        return False
    if fa in pa:
        return True

    canonical = _normalize_area(filter_area)
    if not canonical or canonical not in AREA_ALIASES:
        return False
    alias_terms = [canonical.lower(), *AREA_ALIASES[canonical]]
    return any(term in pa for term in alias_terms)


def _explicit_filter_flags(text: str) -> dict[str, bool]:
    lowered = text.lower()
    return {
        "budget": bool(PRICE_PATTERN.search(lowered)),
        "gender": any(token in lowered for token in ("girls", "boys", "ladies", "gents", "female", "male")),
        "food": any(token in lowered for token in ("food", "meal", "breakfast", "lunch", "dinner", "tiffin")),
        "suitable_for": any(
            token in lowered for token in ("student", "students", "working professional", "professional", "office")
        ),
    }


def _sanitize_extracted_filters(filters: dict, user_message: str) -> dict:
    sanitized = dict(filters or {})
    flags = _explicit_filter_flags(user_message)

    if not flags["budget"]:
        sanitized["max_price"] = None
    if not flags["gender"]:
        sanitized["gender"] = None
    if not flags["food"]:
        sanitized["food_included"] = None
    if not flags["suitable_for"]:
        sanitized["suitable_for"] = None

    return sanitized


def _build_qdrant_filter(filters: dict) -> models.Filter | None:
    must_conditions = []
    
    if filters.get("area"):
        must_conditions.append(
            models.FieldCondition(
                key="area",
                match=models.MatchText(text=filters["area"])
            )
        )
        
    if filters.get("gender") and filters["gender"] != "Both":
        must_conditions.append(
            models.FieldCondition(
                key="gender",
                match=models.MatchAny(any=[filters["gender"], "Both"])
            )
        )
        
    if filters.get("food_included") is not None:
        must_conditions.append(
            models.FieldCondition(
                key="food_included",
                match=models.MatchValue(value=bool(filters["food_included"]))
            )
        )
        
    if filters.get("suitable_for"):
        must_conditions.append(
            models.FieldCondition(
                key="suitable_for",
                match=models.MatchText(text=filters["suitable_for"])
            )
        )
        
    max_price = _to_int_safe(filters.get("max_price"))
    if max_price > 0:
        price_should = []
        for p_key in ["single_price", "double_price", "triple_price"]:
            price_should.append(
                models.FieldCondition(
                    key=p_key,
                    range=models.Range(gt=0, lte=max_price)
                )
            )
        # Any of the valid room configurations must be under budget
        must_conditions.append(models.Filter(should=price_should))
        
    if not must_conditions:
        return None
        
    return models.Filter(must=must_conditions)


def search_node(state: AgentState) -> AgentState:
    messages = [SystemMessage(content=SEARCH_SYSTEM), HumanMessage(content=state["user_message"])]
    raw = llm.invoke(messages).content.strip()

    try:
        if raw.startswith("```"):
            raw = raw.split("```")[1].lstrip("json").strip()
        extracted = json.loads(raw)
    except Exception:
        extracted = {"query": state["user_message"], "filters": {}}

    filters = _sanitize_extracted_filters(extracted.get("filters", {}) or {}, state["user_message"])
    inferred_area = _detect_area_from_text(state["user_message"])
    normalized_area = _normalize_area(filters.get("area")) or inferred_area
    if normalized_area:
        filters["area"] = normalized_area

    query = extracted.get("query", state["user_message"])
    if normalized_area and normalized_area.lower() not in query.lower():
        query = f"{query} in {normalized_area}"

    session = dict(state.get("session_data", {}) or {})
    
    if filters.get("gender") and filters.get("gender") != "Both":
        session["_global_gender"] = filters.get("gender")
    elif not filters.get("gender") and session.get("_global_gender"):
        filters["gender"] = session.get("_global_gender")
        if query == state["user_message"]:
            query += f" for {session.get('_global_gender')}"
            
    session["_last_filters"] = filters
    session["_last_query"] = query

    qdrant_filter = _build_qdrant_filter(filters)
    chroma_results = search_pgs(query, n_results=10, metadata_filter=qdrant_filter)
    matched = chroma_results.get("metadatas", [[]])[0]

    relaxed_filters_used = False
    
    if not matched and qdrant_filter:
        # Soft matching framework via LangGraph reflection trigger
        # We pass intent back to graph to trigger reflection if needed, but for now we try a quick fallback
        loose = dict(filters)
        loose["max_price"] = None
        loose_filter = _build_qdrant_filter(loose)
        
        fallback_results = search_pgs(query, n_results=5, metadata_filter=loose_filter)
        matched = fallback_results.get("metadatas", [[]])[0]
        
        if matched:
            relaxed_filters_used = True
            msg = f"We couldn't find an exact match under your budget, but here are some popular options matching your other criteria:"
        else:
            # Tell graph to deeply reflect if even fallback fails
            return {
                **state,
                "session_data": session,
                "intent": "reflect_search_failure",
                "extracted_filters": filters,
            }
            
    qna_prefix = f"**Here is what you asked:**\n{state.get('response_message', '')}\n\n**PG Results:**\n" if state.get("intent", "") == "qna_and_search" and state.get("response_message") else ""

    if matched:
        if not relaxed_filters_used:
            msg = f"I found {len(matched)} PG{'s' if len(matched) > 1 else ''} matching your requirements:"
        quick_replies = ["Sort by Lowest Price", "Sort by Top Rated", "Change budget", "Different area"]
    else:
        nearby = _get_nearby_areas(normalized_area)
        msg = NOT_FOUND_MESSAGE
        quick_replies = [
            f"Try {nearby[0]}",
            f"Try {nearby[1]}",
            f"Show all in {normalized_area}" if normalized_area else "Show all in Memnagar",
        ]

    msg = qna_prefix + msg

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
