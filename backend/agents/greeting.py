import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from agents.state import AgentState

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.environ.get("GROQ_API_KEY"),
    temperature=0.8,
    max_tokens=300,
)

GREETING_SYSTEM = """
You are PG Finder AI, a friendly assistant that helps people find PG accommodations in Ahmedabad.

When greeting users:
- Be warm, short, and helpful
- Mention you cover: Memnagar, Navrangpura, Prahlad Nagar, Satellite, Shivranjani, Thaltej, Vastrapur, Vijay Crossroads
- Invite them to start searching

Always end with a clear call-to-action question.
Keep it under 3 sentences.
"""


def greeting_node(state: AgentState) -> AgentState:
    messages = [SystemMessage(content=GREETING_SYSTEM), HumanMessage(content=state["user_message"])]
    response = llm.invoke(messages).content.strip()

    return {
        **state,
        "response_mode": "greeting",
        "response_message": response,
        "quick_replies": [
            "PG in Memnagar",
            "PG in Navrangpura",
            "PG in Prahlad Nagar",
            "PG in Satellite",
            "PG in Shivranjani",
            "PG in Thaltej",
            "PG in Vastrapur",
            "PG in Vijay Crossroads",
        ],
        "pgs": [],
        "pg_count": 0,
    }
