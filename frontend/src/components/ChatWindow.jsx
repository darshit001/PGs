import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Sparkles, RotateCcw, Search, MessageSquare } from "lucide-react";
import { useChat } from "../hooks/useChat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

/* ── Loading progress text ──────────────────── */
const loadingSteps = [
  "Searching database...",
  "Ranking matches...",
  "Preparing results...",
];

export default function ChatWindow({ onBack }) {
  const { messages, loading, sendUserMessage, sendButtonClick, resetChat } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  /* ── Typewriter Placeholder ────────────────── */
  const placeholders = [
    "Find a PG in Vastrapur for boys...",
    "What are the highest rated PGs under 15k?",
    "Is there any PG with food included near Memnagar?",
    "Show me Navrangpura PGs with AC...",
    "Tell me about the first one...",
  ];
  const [placeholderText, setPlaceholderText] = useState("");
  const [phIndex, setPhIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    if (isDeleting) {
      timer = setTimeout(() => {
        setPlaceholderText(placeholders[phIndex].substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
        if (charIndex <= 1) {
          setIsDeleting(false);
          setPhIndex((prev) => (prev + 1) % placeholders.length);
        }
      }, 30);
    } else {
      timer = setTimeout(() => {
        setPlaceholderText(placeholders[phIndex].substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
        if (charIndex >= placeholders[phIndex].length) {
          timer = setTimeout(() => setIsDeleting(true), 2500);
        }
      }, 55);
    }
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phIndex]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Loading step rotation
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, loadingSteps.length - 1));
    }, 1500);
    return () => clearInterval(timer);
  }, [loading]);

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    sendUserMessage(text);
  }

  function handleKey(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleQuickReply(text) {
    if (loading) return;
    sendButtonClick(text);
  }

  function confirmReset() {
    resetChat();
    setShowResetConfirm(false);
  }

  const isFirstMessage = messages.length <= 1;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 text-slate-100 p-0 md:px-4 md:py-2 lg:px-8 lg:py-3">
      {/* ── Background Glows ──────────────── */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand/30 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, -35, 0], y: [0, 40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-teal-500/10 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 25, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-teal-600/10 blur-[100px]"
        />
      </div>

      <div className="relative z-10 mx-auto flex flex-1 w-full max-w-7xl flex-col overflow-hidden bg-[#0A0F1D]/80 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 md:rounded-3xl">
        {/* ── Header ─────────────────────────── */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 md:gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
                aria-label="Go back to landing page"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/20">
              <Sparkles className="h-5 w-5" />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0A0F1D] bg-emerald-500" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold tracking-wide text-white sm:text-base">StayEase AI</h2>
              <p className="text-[11px] font-medium text-emerald-400">Online & ready to assist</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Start new search"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Search</span>
            </button>
          </div>
        </div>

        {/* ── Chat Area ──────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-full">
            {/* Onboarding banner for first message */}
            {isFirstMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mx-auto mb-8 max-w-md text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-brand shadow-glow">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="font-display text-lg font-bold text-white">Welcome to StayEase AI</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Pick an area below or type your preferences — I'll find the best PG matches for you in seconds.
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Search className="h-3 w-3" />400+ Listings</span>
                  <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />AI-Powered</span>
                </div>
              </motion.div>
            )}

            {messages.map((msg, index) => (
              <MessageBubble key={msg.id || index} message={msg} onQuickReply={handleQuickReply} />
            ))}

            {/* Loading state */}
            {loading && (
              <div className="mb-4 flex items-start gap-3 px-2">
                <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-white shadow-md shadow-brand/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="mt-1 flex flex-col items-start gap-3">
                  <div className="flex items-center justify-center rounded-2xl rounded-tl-sm border border-white/10 bg-slate-800/80 px-4 py-3 shadow-sm backdrop-blur-md">
                    <TypingIndicator />
                    <span className="ml-3 text-xs font-semibold tracking-wider text-slate-400 animate-pulse uppercase">
                      {loadingSteps[loadingStep]}
                    </span>
                  </div>

                  {/* Skeleton cards */}
                  <div className="flex items-stretch gap-4 overflow-hidden max-w-full mt-2" style={{ perspective: "1500px" }}>
                    {[1, 2, 3].map((skel, i) => (
                      <motion.div
                        key={skel}
                        initial={{ opacity: 0, rotateY: 15, x: 20 }}
                        animate={{ opacity: 0.4, rotateY: 0, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="flex h-[280px] w-[280px] sm:w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-800/40 p-5 shadow-xl backdrop-blur-md"
                      >
                        <div className="h-1 w-full bg-gradient-to-r from-brand/30 to-teal-500/30 rounded-full mb-4" />
                        <div className="h-6 w-3/4 animate-pulse rounded-md bg-slate-700/50" />
                        <div className="mt-2 h-4 w-1/2 animate-pulse rounded-md bg-slate-700/30" />
                        <div className="mt-6 h-20 w-full animate-pulse rounded-xl bg-slate-700/30" />
                        <div className="mt-4 flex gap-2">
                          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-700/50" />
                          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-700/50" />
                          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-700/50" />
                        </div>
                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700/50" />
                            <div className="h-4 w-16 animate-pulse rounded-md bg-slate-700/30" />
                          </div>
                          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-700/50" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>
        </div>

        {/* ── Input Area ─────────────────────── */}
        <div className="flex-shrink-0 border-t border-white/10 bg-[#070A14]/80 p-4 backdrop-blur-xl sm:px-6 sm:py-5">
          <div className="mx-auto w-full max-w-full">
            <div className="relative flex items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0E1527] shadow-inner transition-all focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/30 focus-within:shadow-glow">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                placeholder={placeholderText || "Type your preferences..."}
                className="w-full bg-transparent px-5 py-3.5 text-[15px] font-medium text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50"
                aria-label="Type your PG search preferences"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="mr-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm transition-all hover:bg-brand-dark hover:scale-105 disabled:pointer-events-none disabled:opacity-30"
                aria-label="Send message"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">
              StayEase AI — Ahmedabad's Smartest PG Finder
            </p>
          </div>
        </div>
      </div>

      {/* ── Reset Confirmation Modal ─────── */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
            >
              <h3 className="font-display text-lg font-bold text-white">Start new search?</h3>
              <p className="mt-2 text-sm text-slate-400">
                This will clear your current conversation and start a fresh PG search.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReset}
                  className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  Start Fresh
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
