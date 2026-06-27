export default function QuickReplyButtons({ replies, onButtonClick }) {
  if (!replies || replies.length === 0) return null;

  const areaTokens = new Set([
    "memnagar",
    "navrangpura",
    "prahlad nagar",
    "satellite",
    "shivranjani",
    "thaltej",
    "vastrapur",
    "vijay crossroads",
  ]);

  const isAreaGrid =
    replies.length === 8 &&
    replies.every((reply) => {
      const normalized = reply.toLowerCase().replace(/^pg in\s+/, "").trim();
      return areaTokens.has(normalized);
    });

  return (
    <div className={isAreaGrid ? "mt-2 grid grid-cols-4 gap-2" : "mt-2 flex flex-wrap gap-2"}>
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => onButtonClick(reply)}
          className={`rounded-full border border-slate-600 bg-transparent px-4 py-2 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-500/10 active:scale-95 ${
            isAreaGrid ? "w-full text-center" : ""
          }`}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
