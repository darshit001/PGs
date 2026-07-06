export default function TypingIndicator() {
  return (
    <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-none border border-white/10 bg-slate-800/60 px-5 py-3.5 backdrop-blur-sm">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-brand to-brand-light"
          style={{
            animation: "wave 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
