import { useState } from "react";
import { sendMessage } from "../utils/api";

const WELCOME = {
  role: "assistant",
  type: "greeting",
  content:
    "Namaste! I'm StayEase AI. Pick an area to start and I will guide you by gender, budget, and rating to find the closest PG matches.",
  quickReplies: [
    "PG in Memnagar",
    "PG in Navrangpura",
    "PG in Prahlad Nagar",
    "PG in Satellite",
    "PG in Shivranjani",
    "PG in Thaltej",
    "PG in Vastrapur",
    "PG in Vijay Crossroads",
  ],
};

export function useChat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [apiHistory, setApiHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState({});
  const [pgCount, setPgCount] = useState(0);

  async function sendUserMessage(text, messageSource = "typed") {
    const userMsg = { role: "user", type: "text", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const newHistory = [...apiHistory, { role: "user", content: text }];
    setApiHistory(newHistory);
    setLoading(true);

    try {
      const response = await sendMessage({
        messages: newHistory,
        messageSource,
        sessionData,
        pgCount,
      });

      if (response.session_data) {
        setSessionData(response.session_data);
      }
      if (typeof response.count === "number") {
        setPgCount(response.count);
      }

      const assistantMsg = {
        role: "assistant",
        type: response.mode,
        intent: response.intent,
        content: response.message,
        quickReplies: response.quick_replies || [],
        pgs: response.pgs || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setApiHistory((prev) => [...prev, { role: "assistant", content: response.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "question",
          content: "Something went wrong. Please try again.",
          quickReplies: ["Try again", "Start fresh"],
        },
      ]);
    }

    setLoading(false);
  }

  function sendButtonClick(text) {
    sendUserMessage(text, "button");
  }

  function resetChat() {
    setMessages([WELCOME]);
    setApiHistory([]);
    setSessionData({});
    setPgCount(0);
  }

  return { messages, loading, sendUserMessage, sendButtonClick, resetChat };
}
