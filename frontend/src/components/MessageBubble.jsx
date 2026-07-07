import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import PGCard from "./PGCard";
import QuickReplyButtons from "./QuickReplyButtons";

export default function MessageBubble({ message, onQuickReply }) {
  const isUser = message.role === "user";
  const carouselRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const bubbleVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", bounce: 0.35, duration: 0.5 },
    },
  };

  function scrollCarousel(direction) {
    if (!carouselRef.current) return;
    const scrollAmount = 340;
    carouselRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }

  function copyMessage() {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Format timestamp
  const timeStr = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : null;

  /* ── User Bubble ───────────────────────── */
  if (isUser) {
    return (
      <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="mb-4 flex flex-col items-end">
        <div className="max-w-xs rounded-2xl rounded-br-sm bg-gradient-to-br from-brand to-brand-dark px-4 py-3 text-[15px] leading-relaxed text-white shadow-[0_4px_14px_0_rgb(99,102,241,0.3)] sm:max-w-md">
          {message.content}
        </div>
        {timeStr && (
          <span className="mt-1 mr-1 text-[10px] text-slate-500">{timeStr}</span>
        )}
      </motion.div>
    );
  }

  /* ── Bot Bubble ────────────────────────── */
  const pgCount = message.pgs?.length || 0;

  return (
    <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="mb-6 flex max-w-full flex-col items-start px-2">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-white shadow-md shadow-brand/20">
          <Bot className="h-5 w-5" />
        </div>
        <div className="group relative max-w-[85%] rounded-2xl rounded-tl-sm border border-white/10 bg-slate-800/80 px-4 py-3 text-[15px] leading-relaxed text-slate-100 shadow-sm backdrop-blur-sm sm:max-w-4xl">
          {message.content}

          {/* Copy button on hover */}
          <button
            onClick={copyMessage}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/80 text-slate-400 opacity-0 shadow-md transition-all group-hover:opacity-100 hover:bg-slate-600 hover:text-white"
            title="Copy message"
            aria-label="Copy message"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Timestamp */}
      {timeStr && (
        <span className="mt-1 ml-12 text-[10px] text-slate-500">{timeStr}</span>
      )}

      {/* ── PG Card Carousel ──────────────── */}
      {message.type === "results" && message.pgs && pgCount > 0 && (
        <div className="ml-2 sm:ml-12 mt-4 w-full max-w-full">
          {/* Carousel header */}
          <div className="flex items-center justify-between mb-3 pr-4">
            <span className="text-xs font-semibold text-slate-400">
              {pgCount} {pgCount === 1 ? "result" : "results"} found
            </span>
            {pgCount > 1 && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => scrollCarousel("left")}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollCarousel("right")}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Cards */}
          <div
            ref={carouselRef}
            className="flex w-full gap-4 overflow-x-auto pb-6 pr-8 hide-scrollbar items-stretch snap-x snap-mandatory scroll-smooth"
          >
            {message.pgs.map((pg, i) => (
              <motion.div
                key={pg.id || i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex-shrink-0 flex items-stretch snap-start"
              >
                <PGCard pg={pg} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Replies */}
      {message.quickReplies && message.quickReplies.length > 0 && (
        <div className="ml-2 sm:ml-12 mt-3 w-full max-w-full pr-4">
          <QuickReplyButtons replies={message.quickReplies} onButtonClick={onQuickReply} />
        </div>
      )}
    </motion.div>
  );
}
