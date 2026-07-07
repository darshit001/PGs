import { motion } from "framer-motion";
import { X, MapPin, Phone, Star, Utensils, CheckCircle2, Heart, Map, Building2, Shield, Clock } from "lucide-react";
import { useShortlist } from "../context/ShortlistContext";

export default function PGCardModal({ pg, onClose }) {
  const { isSaved, toggle } = useShortlist();
  if (!pg) return null;

  const saved = isSaved(pg);

  const minPrice = Math.min(
    parseInt(pg.single_price, 10) || 99999,
    parseInt(pg.double_price, 10) || 99999,
    parseInt(pg.triple_price, 10) || 99999
  );

  const allAmenities = pg.amenities ? pg.amenities.split(", ") : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 shadow-2xl scrollbar-thin"
      >
        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-brand/20 via-accent/10 to-slate-900 p-6 pb-8">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              onClick={() => toggle(pg)}
              aria-pressed={saved}
              className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition ${
                saved ? "bg-rose-500/20 text-rose-400" : "bg-black/30 text-white/70 hover:bg-black/50 hover:text-white"
              }`}
              aria-label={saved ? "Remove from shortlist" : "Add to shortlist"}
              title={saved ? "Remove from shortlist" : "Add to shortlist"}
            >
              <Heart className={`h-5 w-5 ${saved ? "fill-rose-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/70 backdrop-blur-sm transition hover:bg-black/50 hover:text-white"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand/20 text-brand backdrop-blur-sm">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl font-bold text-white leading-tight">{pg.name}</h2>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-300">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-brand-light" />
                <span className="truncate">{pg.address}</span>
              </div>
            </div>
          </div>

          {/* Badges row */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-brand/20 px-3 py-1 text-xs font-semibold text-brand-light backdrop-blur-sm">
              {pg.gender}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <Star className="h-3 w-3 fill-accent" /> {pg.rating}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Shield className="h-3 w-3" /> Verified
            </span>
            <span className="text-xs text-slate-400 self-center">({pg.total_reviews} reviews)</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Pricing */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Monthly Rent</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Single", price: pg.single_price, icon: "🛏️" },
                { label: "Double", price: pg.double_price, icon: "🛏️🛏️" },
                { label: "Triple", price: pg.triple_price, icon: "🛏️🛏️🛏️" },
              ].map((tier) => {
                const price = parseInt(tier.price, 10);
                const isAvailable = price > 0 && !isNaN(price);
                const isCheapest = price === minPrice && isAvailable;
                return (
                  <div
                    key={tier.label}
                    className={`rounded-xl border p-3 text-center transition-colors ${
                      isCheapest
                        ? "border-brand/40 bg-brand/10"
                        : "border-white/5 bg-white/[0.02]"
                    } ${!isAvailable ? "opacity-40" : ""}`}
                  >
                    <p className="text-xs text-slate-400">{tier.label}</p>
                    <p className={`mt-1 font-display text-lg font-bold ${isCheapest ? "text-brand-light" : "text-white"}`}>
                      {isAvailable ? `₹${price.toLocaleString("en-IN")}` : "N/A"}
                    </p>
                    {isCheapest && (
                      <span className="mt-1 inline-block text-[10px] font-semibold text-brand-light">Best Value</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Food */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2.5">
              <Utensils className={`h-5 w-5 ${pg.food_included === "True" ? "text-brand" : "text-slate-500"}`} />
              <div>
                <p className={`text-sm font-medium ${pg.food_included === "True" ? "text-white" : "text-slate-400"}`}>
                  {pg.food_included === "True" ? `Food Included — ${pg.food_type}` : "No Meals Provided"}
                </p>
                {pg.food_included === "True" && (
                  <p className="mt-0.5 text-xs text-slate-400">Meals included in the monthly rent</p>
                )}
              </div>
            </div>
          </div>

          {/* Amenities */}
          {allAmenities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {allAmenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-lg bg-slate-800/80 border border-white/5 px-3 py-1.5 text-xs font-medium text-slate-300"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Owner & Actions */}
          <div className="border-t border-white/5 pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent-dark text-sm font-bold text-white">
                  {pg.owner_name ? pg.owner_name.charAt(0) : "O"}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">Owner / Manager</p>
                  <p className="text-sm font-semibold text-white">{pg.owner_name || "Manager"}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <a
                href={`tel:${pg.contact}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark hover:scale-[1.02]"
              >
                <Phone className="h-4 w-4" />
                Call Now
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  pg.address + " " + pg.area + " Ahmedabad"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10 hover:text-white hover:scale-[1.02]"
              >
                <Map className="h-4 w-4" />
                View on Map
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
