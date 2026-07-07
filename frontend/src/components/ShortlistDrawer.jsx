import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Phone, Map, Trash2, Star, GitCompareArrows, Sparkles } from "lucide-react";
import { useShortlist } from "../context/ShortlistContext";
import { pgKey, minPrice, mapsUrl } from "../utils/pg";
import CompareModal from "./CompareModal";

export default function ShortlistDrawer({ open, onClose }) {
  const { items, remove, clear, count } = useShortlist();
  const [comparing, setComparing] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed right-0 top-0 z-[151] flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-[#0A0F1D] shadow-2xl"
              role="dialog"
              aria-label="Your shortlist"
            >
              {/* Header */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.02] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                    <Heart className="h-4.5 w-4.5 fill-rose-400" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-white">Your Shortlist</h2>
                    <p className="text-xs text-slate-400">{count} saved {count === 1 ? "PG" : "PGs"}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close shortlist"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
                {count === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
                      <Heart className="h-8 w-8" />
                    </div>
                    <p className="font-display text-base font-semibold text-white">Nothing saved yet</p>
                    <p className="mt-2 max-w-[15rem] text-sm text-slate-400">
                      Tap the <Heart className="inline h-3.5 w-3.5 -mt-0.5 text-rose-400" /> on any PG card to save it here, then compare your favourites side by side.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {items.map((pg) => (
                      <motion.li
                        key={pgKey(pg)}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="rounded-2xl border border-white/10 bg-slate-800/50 p-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-bold text-white">{pg.name}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-400">{pg.area}</p>
                          </div>
                          <button
                            onClick={() => remove(pg)}
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-400"
                            aria-label={`Remove ${pg.name} from shortlist`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <span className="font-display text-sm font-bold text-brand-light">
                            ₹{(minPrice(pg) || 0).toLocaleString("en-IN")}
                            <span className="ml-0.5 text-[10px] font-medium text-slate-500">/mo</span>
                          </span>
                          <span className="flex items-center gap-1 text-amber-300">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {pg.rating || "—"}
                          </span>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <a
                            href={`tel:${pg.contact}`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >
                            <Phone className="h-3 w-3" /> Call
                          </a>
                          <a
                            href={mapsUrl(pg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                          >
                            <Map className="h-3 w-3" /> Map
                          </a>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer actions */}
              {count > 0 && (
                <div className="flex-shrink-0 space-y-2.5 border-t border-white/10 bg-[#070A14]/80 p-4">
                  <button
                    onClick={() => setComparing(true)}
                    disabled={count < 2}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <GitCompareArrows className="h-4 w-4" />
                    {count < 2 ? "Save 2+ to compare" : `Compare ${Math.min(count, 4)} PGs`}
                  </button>
                  <button
                    onClick={clear}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear shortlist
                  </button>
                  {count > 4 && (
                    <p className="flex items-center justify-center gap-1 text-center text-[11px] text-slate-500">
                      <Sparkles className="h-3 w-3" /> Comparing your first 4 saved PGs
                    </p>
                  )}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {comparing && (
          <CompareModal items={items} onRemove={remove} onClose={() => setComparing(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
