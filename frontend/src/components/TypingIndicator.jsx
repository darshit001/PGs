export default function TypingIndicator() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-none border border-white/10 bg-white/10 px-4 py-3">
      <span
        className="h-2 w-2 animate-bounce rounded-full bg-slate-300"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-2 w-2 animate-bounce rounded-full bg-slate-300"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-2 w-2 animate-bounce rounded-full bg-slate-300"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}
