import { motion } from "framer-motion";
import { X, Phone, Map, Star, Utensils, Trophy, IndianRupee } from "lucide-react";
import { pgKey, minPrice, ratingOf, amenityList, mapsUrl } from "../utils/pg";

/* Renders one comparison row: a sticky label cell + one cell per PG. */
function Row({ label, children, className = "" }) {
  return (
    <div className={`contents ${className}`}>
      <div className="sticky left-0 z-10 flex items-center bg-slate-900/95 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 backdrop-blur-sm">
        {label}
      </div>
      {children}
    </div>
  );
}

export default function CompareModal({ items, onClose, onRemove }) {
  const pgs = items.slice(0, 4);
  if (pgs.length === 0) return null;

  const prices = pgs.map(minPrice);
  const bestPrice = Math.min(...prices.filter((p) => p > 0));
  const ratings = pgs.map(ratingOf);
  const bestRating = Math.max(...ratings);

  const gridCols = { gridTemplateColumns: `84px repeat(${pgs.length}, minmax(140px, 1fr))` };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", bounce: 0.22, duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-r from-brand/15 via-accent/5 to-transparent px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/20 text-brand">
              <Trophy className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">Compare PGs</h2>
              <p className="text-xs text-slate-400">Best price and rating are highlighted</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close comparison"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comparison grid */}
        <div className="overflow-auto scrollbar-thin">
          <div className="grid w-full text-sm" style={gridCols}>
            {/* Names */}
            <Row label="PG">
              {pgs.map((pg) => (
                <div key={pgKey(pg)} className="border-l border-white/5 px-3 py-3">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-display text-sm font-bold leading-tight text-white">{pg.name}</p>
                    <button
                      onClick={() => onRemove(pg)}
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-500 transition hover:bg-rose-500/20 hover:text-rose-400"
                      aria-label={`Remove ${pg.name} from comparison`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="mt-1.5 inline-block rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand-light">
                    {pg.gender}
                  </span>
                </div>
              ))}
            </Row>

            {/* Starting price */}
            <Row label="Rent from">
              {pgs.map((pg, i) => {
                const p = prices[i];
                const isBest = p > 0 && p === bestPrice;
                return (
                  <div key={pgKey(pg)} className="border-l border-t border-white/5 px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-0.5 font-display text-lg font-bold ${
                        isBest ? "text-brand-light" : "text-white"
                      }`}
                    >
                      <IndianRupee className="h-3.5 w-3.5" />
                      {p > 0 ? p.toLocaleString("en-IN") : "—"}
                    </span>
                    {isBest && (
                      <span className="ml-1.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-light">
                        Lowest
                      </span>
                    )}
                  </div>
                );
              })}
            </Row>

            {/* Sharing tiers */}
            {[
              ["Single", "single_price"],
              ["Double", "double_price"],
              ["Triple", "triple_price"],
            ].map(([label, key]) => (
              <Row key={key} label={label}>
                {pgs.map((pg) => {
                  const val = parseInt(pg[key], 10);
                  const ok = Number.isFinite(val) && val > 0;
                  return (
                    <div
                      key={pgKey(pg)}
                      className={`border-l border-t border-white/5 px-3 py-2.5 text-slate-200 ${ok ? "" : "text-slate-600"}`}
                    >
                      {ok ? `₹${val.toLocaleString("en-IN")}` : "N/A"}
                    </div>
                  );
                })}
              </Row>
            ))}

            {/* Rating */}
            <Row label="Rating">
              {pgs.map((pg, i) => {
                const isBest = ratings[i] > 0 && ratings[i] === bestRating;
                return (
                  <div key={pgKey(pg)} className="border-l border-t border-white/5 px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        isBest ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-slate-300"
                      }`}
                    >
                      <Star className={`h-3 w-3 ${isBest ? "fill-amber-400 text-amber-400" : "fill-slate-500 text-slate-500"}`} />
                      {pg.rating || "—"}
                    </span>
                    <span className="ml-1 text-[10px] text-slate-500">({pg.total_reviews || 0})</span>
                  </div>
                );
              })}
            </Row>

            {/* Food */}
            <Row label="Food">
              {pgs.map((pg) => {
                const on = pg.food_included === "True";
                return (
                  <div key={pgKey(pg)} className="border-l border-t border-white/5 px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${on ? "text-brand-light" : "text-slate-500"}`}>
                      <Utensils className="h-3.5 w-3.5" />
                      {on ? pg.food_type || "Included" : "None"}
                    </span>
                  </div>
                );
              })}
            </Row>

            {/* Amenities */}
            <Row label="Amenities">
              {pgs.map((pg) => (
                <div key={pgKey(pg)} className="flex flex-wrap gap-1 border-l border-t border-white/5 px-3 py-3">
                  {amenityList(pg).slice(0, 5).map((a) => (
                    <span key={a} className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
                      {a}
                    </span>
                  ))}
                </div>
              ))}
            </Row>

            {/* Actions */}
            <Row label="Contact">
              {pgs.map((pg) => (
                <div key={pgKey(pg)} className="flex flex-col gap-1.5 border-l border-t border-white/5 px-3 py-3">
                  <a
                    href={`tel:${pg.contact}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-brand px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                  >
                    <Phone className="h-3 w-3" /> Call
                  </a>
                  <a
                    href={mapsUrl(pg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    <Map className="h-3 w-3" /> Map
                  </a>
                </div>
              ))}
            </Row>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
