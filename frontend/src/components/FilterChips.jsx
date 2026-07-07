import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Wallet, Users, SlidersHorizontal } from "lucide-react";

/*
 * Surfaces the filters the backend is currently applying (stored in
 * session_data._last_filters) so the user can see and adjust their search
 * state. Tapping an editable chip sends a supported follow-up command.
 */
export default function FilterChips({ filters, onEdit }) {
  if (!filters) return null;

  const chips = [];

  if (filters.area) {
    chips.push({ key: "area", icon: MapPin, label: filters.area, command: "Different area" });
  }
  const price = parseInt(filters.max_price, 10);
  if (Number.isFinite(price) && price > 0) {
    chips.push({
      key: "budget",
      icon: Wallet,
      label: `≤ ₹${price.toLocaleString("en-IN")}`,
      command: "Change budget",
    });
  }
  if (filters.gender && filters.gender !== "Both") {
    chips.push({ key: "gender", icon: Users, label: filters.gender });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        <SlidersHorizontal className="h-3 w-3" />
        Filters
      </span>
      <AnimatePresence initial={false}>
        {chips.map((chip) => {
          const Icon = chip.icon;
          const editable = Boolean(chip.command);
          return (
            <motion.button
              key={chip.key}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={editable ? () => onEdit(chip.command) : undefined}
              disabled={!editable}
              title={editable ? `Change ${chip.key}` : undefined}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                editable
                  ? "cursor-pointer border-brand/25 bg-brand/10 text-brand-light hover:border-brand/50 hover:bg-brand/20"
                  : "cursor-default border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {chip.label}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
