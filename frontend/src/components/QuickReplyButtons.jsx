import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

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

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={isAreaGrid ? "mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2" : "mt-3 flex flex-wrap gap-2"}
    >
      {replies.map((reply) => {
        const isArea = areaTokens.has(reply.toLowerCase().replace(/^pg in\s+/, "").trim());
        return (
          <motion.button
            key={reply}
            variants={itemVariants}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onButtonClick(reply)}
            className={`group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-sm transition-all duration-200 hover:border-brand/40 hover:bg-brand/10 hover:text-white hover:shadow-md hover:shadow-brand/10 ${
              isAreaGrid ? "w-full text-center" : ""
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {isArea && <MapPin className="h-3.5 w-3.5 text-brand-light opacity-70 group-hover:opacity-100 transition-opacity" />}
              {isArea ? reply.replace(/^PG in\s+/i, "") : reply}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
