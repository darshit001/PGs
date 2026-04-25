import { useRef } from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import PGCard from "./PGCard";
import QuickReplyButtons from "./QuickReplyButtons";

export default function MessageBubble({ message, onQuickReply }) {
  const isUser = message.role === "user";
  const carouselRef = useRef(null);

  const bubbleVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", bounce: 0.35, duration: 0.5 },
    },
  };

  if (isUser) {
    return (
      <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="mb-4 flex justify-end">
        <div className="max-w-xs rounded-2xl rounded-br-sm bg-gradient-to-br from-indigo-500 to-purple-600 px-4 py-3 text-[15px] leading-relaxed text-white shadow-[0_4px_14px_0_rgb(99,102,241,0.39)] sm:max-w-md">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={bubbleVariants} initial="hidden" animate="visible" className="mb-6 flex max-w-full flex-col items-start px-2">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-md shadow-brand/20">
          <Bot className="h-5 w-5" />
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/10 bg-slate-800/80 px-4 py-3 text-[15px] leading-relaxed text-slate-100 shadow-sm backdrop-blur-sm sm:max-w-4xl">
          {message.content}
        </div>
      </div>

      {message.type === "results" && message.pgs && message.pgs.length > 0 && (
        <div 
          ref={carouselRef}
          className="ml-2 sm:ml-12 mt-4 flex w-[calc(100vw-2rem)] sm:w-full max-w-[100%] gap-4 sm:gap-6 overflow-x-auto pb-8 pt-4 pr-8 hide-scrollbar items-stretch snap-x snap-mandatory"
        >
          {message.pgs.map((pg, i) => (
            <motion.div
              key={pg.id || i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex-shrink-0 flex items-stretch h-auto snap-start scroll-ml-2 sm:scroll-ml-12"
            >
              <PGCard pg={pg} />
            </motion.div>
          ))}
        </div>
      )}

      {message.quickReplies && message.quickReplies.length > 0 && (
        <div className="ml-12 mt-3">
          <QuickReplyButtons replies={message.quickReplies} onButtonClick={onQuickReply} />
        </div>
      )}
    </motion.div>
  );
}
