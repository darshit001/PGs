import re
import difflib

from agents.state import AgentState
from chroma_store import search_pgs

AREAS = [
    "Memnagar",
    "Navrangpura",
    "Prahlad Nagar",
    "Satellite",
    "Shivranjani",
    "Thaltej",
    "Vastrapur",
    "Vijay Crossroads",
]

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

STEPS = ["area", "gender", "budget", "rating"]

STEP_QUESTIONS = {
    "area": {
        "message": "Which area are you looking in?",
        "quick_replies": AREAS,
    },
    "gender": {
        "message": "Who is the PG for?",
        "quick_replies": ["Boys", "Girls", "Both"],
    },
    "budget": {
        "message": "What is your monthly budget?",
        "quick_replies": ["Under ₹8,000", "₹8,000 – ₹12,000", "₹12,000 – ₹15,000", "₹15,000+"],
    },
    "rating": {
        "message": "What minimum rating do you prefer?",
        "quick_replies": ["4.5+ ⭐", "4.0+ ⭐", "3.5+ ⭐", "Any rating"],
    },
}

BUDGET_MAP = {
    "under ₹8,000": 8000,
    "₹8,000 – ₹12,000": 12000,
    "₹12,000 – ₹15,000": 15000,
    "₹15,000+": 99999,
    "under 8k": 8000,
    "8k-12k": 12000,
    "12k-15k": 15000,
}

NOT_FOUND_MESSAGE = (
    "We did not find a PG in this area for your exact requirements yet. "
    "We are adding more and more sources in the future, so stay connected with us. "
    "Meanwhile, try searching in another nearby area."
)


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


def _normalize_text(text: str) -> str:
    return " ".join(text.lower().strip().split())


def _parse_area(value: str):
    text = _normalize_text(value)
    
    # Exact/Alias match
    for canonical, aliases in AREA_ALIASES.items():
        alias_tokens = (canonical.lower(),) + aliases
        if any(token in text for token in alias_tokens):
            return canonical
            
    # Fuzzy match
    flat_aliases = {alias: canon for canon, aliases in AREA_ALIASES.items() for alias in [canon.lower()] + list(aliases)}
    words = text.split()
    bigrams = [" ".join(words[i:i+2]) for i in range(len(words)-1)]
    candidates = words + bigrams
    
    for cand in candidates:
        match = difflib.get_close_matches(cand, flat_aliases.keys(), n=1, cutoff=0.7)
        if match:
            return flat_aliases[match[0]]
            
    return None


def _parse_button_value(step: str, value: str):
    text = _normalize_text(value)

    if step == "area":
        return _parse_area(value)

    if step == "gender":
        if "boy" in text:
            return "Boys"
        if "girl" in text:
            return "Girls"
        if "both" in text or "either" in text:
            return "Both"
        return None

    if step == "budget":
        for key, amount in BUDGET_MAP.items():
            if _normalize_text(key) in text:
                return amount

        # Backup parse for values like "10k"
        k_match = re.search(r"(\d{1,2})\s*k", text)
        if k_match:
            return int(k_match.group(1)) * 1000

        # Parse values like 10000 / ₹12000 / under 9000
        digit_match = re.search(r"(?:₹\s*)?(\d{4,5})", text)
        if digit_match:
            return int(digit_match.group(1))

        under_match = re.search(r"under\s*(\d{4,5})", text)
        if under_match:
            return int(under_match.group(1))
        return None

    if step == "rating":
        if "any" in text:
            return 0.0
        if "4.5" in text:
            return 4.5
        if "4.0" in text or "4+" in text:
            return 4.0
        if "3.5" in text:
            return 3.5
        numeric = re.search(r"(\d(?:\.\d)?)", text)
        if numeric:
            return float(numeric.group(1))
        return None

    return None


def _next_missing_step(session: dict):
    for step in STEPS:
        if step not in session or session.get(step) is None:
            return step
    return None


def _capture_current_selection(session: dict, user_msg: str) -> None:
    step = _next_missing_step(session)
    if not step:
        return
    parsed = _parse_button_value(step, user_msg)
    if parsed is not None:
        session[step] = parsed


def _area_matches(selected_area: str, pg_area: str) -> bool:
    if not selected_area:
        return True
    target = _normalize_text(selected_area)
    candidate = _normalize_text(pg_area or "")
    if not candidate:
        return False
    if target in candidate:
        return True

    aliases = AREA_ALIASES.get(selected_area, ())
    return any(alias in candidate for alias in aliases)


def _min_price(pg: dict) -> int:
    prices = [_to_int_safe(pg.get(key, 0)) for key in ("single_price", "double_price", "triple_price")]
    prices = [price for price in prices if price > 0]
    return min(prices) if prices else 0


def _rank_candidates(
    candidates: list[dict],
    session: dict,
    budget_slack: int = 0,
    ignore_rating: bool = False,
):
    selected_area = session.get("area")
    selected_gender = session.get("gender")
    selected_budget = _to_int_safe(session.get("budget"))
    selected_rating = _to_float_safe(session.get("rating"))

    ranked = []
    seen_ids = set()

    for pg in candidates:
        pg_id = str(pg.get("id", "")) or f"{pg.get('name','')}-{pg.get('address','')}"
        if pg_id in seen_ids:
            continue

        if selected_area and not _area_matches(selected_area, pg.get("area", "")):
            continue

        if selected_gender and selected_gender != "Both":
            if pg.get("gender") not in [selected_gender, "Both"]:
                continue

        price = _min_price(pg)
        budget_limit = selected_budget + max(0, budget_slack)
        if selected_budget > 0 and price > 0 and price > budget_limit:
            continue

        rating = _to_float_safe(pg.get("rating"))
        if selected_rating > 0 and (not ignore_rating) and rating < selected_rating:
            continue

        score = 40.0

        if selected_gender and selected_gender != "Both":
            score += 12.0 if pg.get("gender") == selected_gender else 8.0
        else:
            score += 6.0

        if selected_budget > 0 and price > 0:
            gap = abs(budget_limit - price)
            score += max(0.0, 25.0 - (gap / 250.0))
        elif selected_budget > 0:
            score += 5.0

        if selected_rating > 0 and not ignore_rating:
            score += max(0.0, 20.0 - ((selected_rating - rating) * 20.0))
        else:
            score += rating * 3.0

        if price > 0:
            score += max(0.0, 10.0 - (price / 3000.0))

        ranked.append((score, rating, -price, pg))
        seen_ids.add(pg_id)

    ranked.sort(key=lambda row: (row[0], row[1], row[2]), reverse=True)
    return [row[3] for row in ranked[:8]]


def _find_closest_matches(session: dict):
    area = session.get("area", "Ahmedabad")
    gender = session.get("gender", "Both")
    budget = _to_int_safe(session.get("budget"))
    rating = _to_float_safe(session.get("rating"))

    query = f"PG in {area}"
    if gender and gender != "Both":
        query += f" for {gender}"
    if budget > 0:
        query += f" under {budget}"
    if rating > 0:
        query += f" with rating {rating} or higher"

    primary_results = search_pgs(query, n_results=120)
    candidates = primary_results.get("metadatas", [[]])[0]

    strict = _rank_candidates(candidates, session, budget_slack=0, ignore_rating=False)
    if strict:
        return strict, "strict"

    if rating > 0:
        relaxed_rating = _rank_candidates(candidates, session, budget_slack=0, ignore_rating=True)
        if relaxed_rating:
            return relaxed_rating, "relaxed_rating"

    relaxed_budget = _rank_candidates(candidates, session, budget_slack=2000, ignore_rating=True)
    if relaxed_budget:
        return relaxed_budget, "relaxed_budget"

    fallback_results = search_pgs(f"PG in {area} Ahmedabad", n_results=120)
    fallback_candidates = fallback_results.get("metadatas", [[]])[0]
    fallback_session = {**session, "budget": 0, "rating": 0}
    fallback = _rank_candidates(fallback_candidates, fallback_session, budget_slack=0, ignore_rating=True)
    if fallback:
        return fallback, "area_fallback"

    return [], "none"


def guided_node(state: AgentState) -> AgentState:
    session = dict(state.get("session_data", {}) or {})

    _capture_current_selection(session, state["user_message"])
    next_step = _next_missing_step(session)

    if not next_step:
        matched, match_mode = _find_closest_matches(session)

        if matched:
            if match_mode == "strict":
                msg = (
                    f"Great! I found {len(matched)} PG"
                    f"{'s' if len(matched) > 1 else ''} matching your preferences."
                )
            else:
                msg = (
                    f"I found {len(matched)} closest PG"
                    f"{'s' if len(matched) > 1 else ''} based on your selected filters."
                )
            quick_replies = ["Sort by Lowest Price", "Sort by Top Rated", "Change budget", "Start over"]
        else:
            nearby = _get_nearby_areas(session.get("area"))
            msg = NOT_FOUND_MESSAGE
            quick_replies = [f"Try {nearby[0]}", f"Try {nearby[1]}", "Start over"]

        new_session = {
            "_last_filters": {
                "area": session.get("area"),
                "max_price": _to_int_safe(session.get("budget")) or None,
                "gender": session.get("gender") if session.get("gender") != "Both" else None,
                "food_included": None,
                "suitable_for": None
            },
            "_last_query": f"PG in {session.get('area', 'Ahmedabad')}",
            "_global_gender": session.get("gender") if session.get("gender") and session.get("gender") != "Both" else session.get("_global_gender"),
            "_last_results": [{"id": pg.get("id", ""), "name": pg.get("name", "")} for pg in matched],
            "_last_results_details": [pg.get("_doc", "") for pg in matched[:4]]
        }

        return {
            **state,
            "session_data": new_session,
            "response_mode": "results",
            "response_message": msg,
            "quick_replies": quick_replies,
            "pgs": matched,
            "pg_count": len(matched),
        }

    session["_last_asked"] = next_step
    step_data = STEP_QUESTIONS[next_step]

    return {
        **state,
        "session_data": session,
        "response_mode": "question",
        "response_message": step_data["message"],
        "quick_replies": step_data["quick_replies"],
        "pgs": [],
        "pg_count": 0,
    }
