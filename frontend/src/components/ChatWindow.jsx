import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { useChat } from "../hooks/useChat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({ onBack }) {
  const { messages, loading, sendUserMessage, sendButtonClick, resetChat } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // Typewriter Placeholder
  const placeholders = [
    "Find a PG in Vastrapur for boys...",
    "What are the highest rated PGs under 15k?",
    "Is there any PG with food included near Memnagar?",
    "Show me Navrangpura PGs with AC...",
    "Tell me about the first one..."
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
      }, 60);
    }
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phIndex]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 text-slate-100 selection:bg-brand/30 selection:text-brand-light p-0 md:px-4 md:py-2 lg:px-8 lg:py-3">
      {/* Background gradients aligned visually */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <motion.div animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand/30 blur-[100px]" />
        <motion.div animate={{ scale: [1, 1.15, 1], x: [0, -35, 0], y: [0, 40, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
        <motion.div animate={{ scale: [1, 1.1, 1], x: [0, 25, 0], y: [0, -20, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex flex-1 w-full max-w-7xl flex-col overflow-hidden bg-[#0A0F1D]/80 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 md:rounded-3xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 md:gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
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
              onClick={resetChat}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              New Search
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 hide-scrollbar sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[100%]">
            {messages.map((msg, index) => (
              <MessageBubble key={index} message={msg} onQuickReply={handleQuickReply} />
            ))}

            {loading && (
              <div className="mb-4 flex items-start gap-3 px-2">
                <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand/30 text-xs font-bold text-white shadow-sm glow glow-brand">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="mt-1 flex flex-col items-start gap-3">
                  <div className="flex items-center justify-center rounded-2xl rounded-tl-sm border border-white/10 bg-slate-800/80 px-4 py-3 shadow-sm backdrop-blur-md">
                    <TypingIndicator />
                    <span className="ml-3 text-xs font-semibold tracking-wider text-slate-400 animate-pulse uppercase">Searching Database...</span>
                  </div>
                  
                  <div className="flex items-stretch gap-4 overflow-hidden max-w-full mt-2" style={{ perspective: "1500px" }}>
                    {[1, 2, 3].map((skel, i) => (
                      <motion.div 
                        key={skel} 
                        initial={{ opacity: 0, rotateY: 15, x: 20 }}
                        animate={{ opacity: 0.5, rotateY: 0, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="flex h-[280px] w-[280px] sm:w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-800/40 p-5 shadow-xl backdrop-blur-md"
                      >
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

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-white/10 bg-[#070A14]/80 p-4 backdrop-blur-xl sm:px-6 sm:py-5">
          <div className="mx-auto w-full max-w-[100%]">
            <div className="relative flex items-center overflow-hidden rounded-full border border-white/10 bg-[#0E1527] shadow-inner transition-all focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/50">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
                placeholder={placeholderText || "Type your preferences..."}
                className="w-full bg-transparent px-5 py-3.5 text-[15px] font-medium text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="mr-1.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-all hover:bg-brand-dark hover:scale-105 disabled:pointer-events-none disabled:opacity-40"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-slate-600">
              STAYEASE AI — AHMEDABAD'S SMARTEST PG FINDER
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
