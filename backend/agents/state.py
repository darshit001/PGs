from typing import List, Optional, TypedDict


class AgentState(TypedDict, total=False):
    # Input
    user_message: str
    message_source: str  # "typed" | "button"
    conversation_history: List[dict]
    session_data: dict

    # Routing
    intent: str  # "greeting" | "search" | "guided" | "followup" | "qna" | "reflect_search_failure" | "reflect_and_search"
    extracted_filters: Optional[dict]  # relaxed filters handed from reflection_node back to search_node

    # Output
    response_mode: str  # "question" | "results" | "answer" | "greeting"
    response_message: str
    quick_replies: List[str]
    pgs: List[dict]
    pg_count: int
