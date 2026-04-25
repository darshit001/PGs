import json
import os
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from agents.state import AgentState

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.environ.get("GROQ_API_KEY"),
    temperature=0,
    max_tokens=256,
)

REFLECTION_SYSTEM = """
You are the self-correction module for StayEase AI.
A search just failed to yield any PG results. 
The user asked: "{user_query}"
The previously extracted strict filters were:
{filters}

Your job is to RELAX the filters to ensure we find something nearby or slightly outside their parameters, so they aren't left with an empty screen.
Rules for relaxing:
1. First, try relaxing exact 'food_included' constraints (set to null).
2. Or, if budget is extremely tight, increase the budget by 2000 or set to null.
3. If Area is extremely specific, set Area to null to expand city-wide.
4. NEVER change gender.

Return ONLY the updated filters JSON object:
{{
    "area": ...,
    "max_price": ...,
    "gender": ...,
    "food_included": ...,
    "suitable_for": ...
}}
Do NOT use markdown blocks, just raw JSON.
"""

def reflection_node(state: AgentState) -> AgentState:
    filters = state.get("extracted_filters", {})
    query = state.get("user_message", "")
    
    prompt = REFLECTION_SYSTEM.format(user_query=query, filters=json.dumps(filters, indent=2))
    raw = llm.invoke([SystemMessage(content="You are a smart JSON API."), HumanMessage(content=prompt)]).content.strip()
    
    try:
        new_filters = json.loads(raw)
    except Exception:
        # Fallback manual relaxation
        new_filters = dict(filters)
        new_filters["max_price"] = None
        new_filters["food_included"] = None
        new_filters["area"] = None
        
    session = state.get("session_data", {})
    
    msg_prefix = "I couldn't find an exact match for your strict requirements, so I expanded the search parameters a bit. Here is what I found:\n\n"
    
    return {
        **state,
        "session_data": session,
        "extracted_filters": new_filters,
        "intent": "reflect_and_search", # Graph will route this back to search!
        "response_message": msg_prefix
    }
