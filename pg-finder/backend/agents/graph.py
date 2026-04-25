from langgraph.graph import END, StateGraph

from agents.followup import followup_node
from agents.greeting import greeting_node
from agents.guided import guided_node
from agents.qna import qna_node
from agents.router import router_node
from agents.search import search_node
from agents.reflection import reflection_node
from agents.state import AgentState


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("router", router_node)
    graph.add_node("greeting", greeting_node)
    graph.add_node("search", search_node)
    graph.add_node("reflection", reflection_node)
    graph.add_node("guided", guided_node)
    graph.add_node("followup", followup_node)
    graph.add_node("qna", qna_node)

    graph.set_entry_point("router")

    def route_by_intent(state: AgentState) -> str:
        intent = state.get("intent", "qna")
        if intent not in {"greeting", "search", "guided", "followup", "qna", "qna_and_search"}:
            return "qna"
        if intent == "qna_and_search":
            return "qna"
        return intent

    graph.add_conditional_edges(
        "router",
        route_by_intent,
        {
            "greeting": "greeting",
            "search": "search",
            "guided": "guided",
            "followup": "followup",
            "qna": "qna",
        },
    )

    def route_after_qna(state: AgentState) -> str:
        if state.get("intent", "") == "qna_and_search":
            return "search"
        return END

    def route_after_search(state: AgentState) -> str:
        if state.get("intent", "") == "reflect_search_failure":
            return "reflection"
        return END
        
    def route_after_reflection(state: AgentState) -> str:
        return "search"

    graph.add_edge("greeting", END)
    graph.add_conditional_edges("search", route_after_search, {"reflection": "reflection", END: END})
    graph.add_edge("reflection", "search")
    graph.add_edge("guided", END)
    graph.add_edge("followup", END)
    graph.add_conditional_edges("qna", route_after_qna, {"search": "search", END: END})

    return graph.compile()


pg_graph = build_graph()
