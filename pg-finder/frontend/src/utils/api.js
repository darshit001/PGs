// In Docker: Nginx reverse-proxies /api/* → backend container (http://backend:8000)
// In local dev: Update this to "http://localhost:8000" or use Vite proxy
const BASE_URL = "/api";

export async function sendMessage({
  messages,
  messageSource = "typed",
  sessionData = {},
  pgCount = 0,
}) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      message_source: messageSource,
      session_data: sessionData,
      pg_count: pgCount,
    }),
  });

  if (!res.ok) {
    throw new Error(`API failed with ${res.status}`);
  }

  return res.json();
}
