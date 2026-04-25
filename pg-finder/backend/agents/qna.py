import os

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from agents.state import AgentState
from chroma_store import search_pgs

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.environ.get("GROQ_API_KEY"),
    temperature=0.6,
    max_tokens=400,
)

QNA_SYSTEM = """
You are a helpful PG (Paying Guest) expert assistant for Ahmedabad, India.

You answer questions about:
- What is a PG / how it works
- Ahmedabad areas: Memnagar, Navrangpura, Prahlad Nagar, Satellite, Shivranjani, Thaltej, Vastrapur, Vijay Crossroads
- Typical amenities (WiFi, AC, laundry, food, etc.)
- Pricing norms in Ahmedabad (single 6K–12K, double 4K–8K, triple 3K–6K typical)
- Deposit and notice period norms
- Difference between PG, hostel, and co-living
- Specific Paying Guests (using the provided knowledge context)

Keep answers short (2–4 sentences max), but be thorough if asked about a specific property.
Always end with a nudge to search for PGs if it's a general question.
"""

SEARCH_NUDGE_REPLIES = [
    "PG in Memnagar",
    "PG in Navrangpura",
    "PG in Satellite",
]


def qna_node(state: AgentState) -> AgentState:
    user_message = state["user_message"]
    history = state.get("conversation_history", [])[-6:]
    session = state.get("session_data", {}) or {}
    
    rag_results = search_pgs(user_message, n_results=3)
    docs = rag_results.get("documents", [[]])[0]
    
    context_text = "\n\n---\n\n".join(docs)
    
    last_details = session.get("_last_results_details", [])
    if last_details:
        context_text += "\n\n=== RECENTLY SHOWN RESULTS ===\n"
        for i, detail in enumerate(last_details):
            context_text += f"\n[Item {i+1}]:\n{detail}"
    
    system_prompt = (
        QNA_SYSTEM 
        + "\n\nDATABASE KNOWLEDGE CONTEXT (Retrieved from actual real-time listings):\n" 
        + context_text 
        + "\n\nIf the user asks about a specific PG or specific prices (or uses ordinal terms like 'the first one', 'that one'), ONLY use the context above to answer. If the context does not contain the answer, state that you do not have that specific information."
    )
    
    messages = [SystemMessage(content=system_prompt)]

    for h in history:
        if h.get("role") == "user":
            messages.append(HumanMessage(content=h.get("content", "")))
        else:
            messages.append(AIMessage(content=h.get("content", "")))

    messages.append(HumanMessage(content=state["user_message"]))

    response = llm.invoke(messages).content.strip()

    if state.get("intent", "") == "qna_and_search":
        return {
            **state,
            "response_message": response
        }

    return {
        **state,
        "response_mode": "answer",
        "response_message": response,
        "quick_replies": SEARCH_NUDGE_REPLIES,
        "pgs": [],
        "pg_count": 0,
    }
