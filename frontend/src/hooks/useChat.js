import { useState, useCallback } from "react";
import { sendMessage } from "../utils/api";

let messageIdCounter = 0;
function generateId() {
  return `msg_${Date.now()}_${++messageIdCounter}`;
}

const WELCOME = {
  id: generateId(),
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
  timestamp: Date.now(),
};

const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

export function useChat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [apiHistory, setApiHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState({});
  const [pgCount, setPgCount] = useState(0);

  const sendUserMessage = useCallback(async (text, messageSource = "typed") => {
    const userMsg = {
      id: generateId(),
      role: "user",
      type: "text",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const newHistory = [...apiHistory, { role: "user", content: text }];
    setApiHistory(newHistory);
    setLoading(true);

    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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
          id: generateId(),
          role: "assistant",
          type: response.mode,
          intent: response.intent,
          content: response.message,
          quickReplies: response.quick_replies || [],
          pgs: response.pgs || [],
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setApiHistory((prev) => [...prev, { role: "assistant", content: response.message }]);
        setLoading(false);
        return; // Success — exit
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
        }
      }
    }

    // All retries failed
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        role: "assistant",
        type: "question",
        content: "Something went wrong. Please try again.",
        quickReplies: ["Try again", "Start fresh"],
        timestamp: Date.now(),
      },
    ]);
    setLoading(false);
  }, [apiHistory, sessionData, pgCount]);

  const sendButtonClick = useCallback((text) => {
    sendUserMessage(text, "button");
  }, [sendUserMessage]);

  const resetChat = useCallback(() => {
    messageIdCounter = 0;
    const newWelcome = { ...WELCOME, id: generateId(), timestamp: Date.now() };
    setMessages([newWelcome]);
    setApiHistory([]);
    setSessionData({});
    setPgCount(0);
  }, []);

  return { messages, loading, sendUserMessage, sendButtonClick, resetChat };
}
