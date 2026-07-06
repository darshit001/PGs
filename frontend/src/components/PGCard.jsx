import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Star, Utensils, CheckCircle2, Heart, Map, Expand, Award, TrendingDown, Sparkles } from "lucide-react";
import PGCardModal from "./PGCardModal";

export default function PGCard({ pg }) {
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const minPrice = Math.min(
    parseInt(pg.single_price, 10) || 99999,
    parseInt(pg.double_price, 10) || 99999,
    parseInt(pg.triple_price, 10) || 99999
  );

  const amenities = pg.amenities ? pg.amenities.split(", ").slice(0, 4) : [];
  const rating = parseFloat(pg.rating) || 0;

  // Determine badge
  let badge = null;
  if (rating >= 4.5) {
    badge = { label: "Top Rated", icon: Award, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  } else if (minPrice <= 8000) {
    badge = { label: "Best Value", icon: TrendingDown, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  }

  // Accent gradient based on rating
  const accentGradient =
    rating >= 4.5
      ? "from-amber-500 via-yellow-500 to-amber-400"
      : rating >= 4.0
        ? "from-brand to-teal-500"
        : "from-slate-600 to-slate-500";

  return (
    <>
      <div className="group flex h-full w-[300px] sm:w-[330px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-800/60 shadow-card backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-brand/40 hover:shadow-card-hover">
        {/* Top Accent Line */}
        <div className={`h-1 flex-shrink-0 w-full bg-gradient-to-r ${accentGradient}`} />

        <div className="flex flex-1 flex-col p-5">
          {/* Header: Name, Gender, Save */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-display text-lg font-bold leading-tight text-white truncate">{pg.name}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-brand-light/60" />
                <span className="truncate">{pg.address}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className="whitespace-nowrap rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold tracking-wide text-brand-light">
                {pg.gender}
              </span>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setSaved(!saved)}
                className={`rounded-full p-1.5 transition-colors ${
                  saved
                    ? "bg-rose-500/20 text-rose-500"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white"
                }`}
                title={saved ? "Remove from Shortlist" : "Add to Shortlist"}
                aria-label={saved ? "Remove from Shortlist" : "Add to Shortlist"}
              >
                <Heart className={`h-4 w-4 transition-all ${saved ? "fill-rose-500 scale-110" : ""}`} />
              </motion.button>
            </div>
          </div>

          {/* Badge + Rating */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            {badge && (
              <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.color}`}>
                <badge.icon className="h-3 w-3" />
                {badge.label}
              </span>
            )}
            <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1">
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              <span className="text-xs font-semibold text-yellow-500">{pg.rating}</span>
            </div>
            <span className="text-xs text-slate-400">({pg.total_reviews} reviews)</span>
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified
            </span>
          </div>

          {/* Price */}
          <div className="mb-4 rounded-xl border border-white/5 bg-slate-900/50 p-3">
            <p className="mb-1 text-xs text-slate-400">Monthly Rent Starts At</p>
            <div className="flex items-baseline gap-1">
              <p className="font-display text-2xl font-bold text-white">
                ₹{minPrice.toLocaleString("en-IN")}
              </p>
              <span className="text-xs text-slate-400">/mo</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-300">
              {pg.single_price && pg.single_price !== "0" && (
                <span className={`rounded-md px-2 py-1 ${parseInt(pg.single_price) === minPrice ? 'bg-brand/15 text-brand-light border border-brand/20' : 'bg-white/5'}`}>
                  1-Bed: ₹{parseInt(pg.single_price, 10).toLocaleString("en-IN")}
                </span>
              )}
              {pg.double_price && pg.double_price !== "0" && (
                <span className={`rounded-md px-2 py-1 ${parseInt(pg.double_price) === minPrice ? 'bg-brand/15 text-brand-light border border-brand/20' : 'bg-white/5'}`}>
                  2-Bed: ₹{parseInt(pg.double_price, 10).toLocaleString("en-IN")}
                </span>
              )}
              {pg.triple_price && pg.triple_price !== "0" && (
                <span className={`rounded-md px-2 py-1 ${parseInt(pg.triple_price) === minPrice ? 'bg-brand/15 text-brand-light border border-brand/20' : 'bg-white/5'}`}>
                  3-Bed: ₹{parseInt(pg.triple_price, 10).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          {/* Food */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Utensils className={`h-4 w-4 ${pg.food_included === "True" ? "text-brand" : "text-slate-500"}`} />
              <span className={`text-sm font-medium ${pg.food_included === "True" ? "text-slate-200" : "text-slate-400"}`}>
                {pg.food_included === "True" ? `Food included (${pg.food_type})` : "No meals provided"}
              </span>
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {amenities.map((amenity) => (
                <span key={amenity} className="rounded-full bg-slate-700/50 border border-white/5 px-2.5 py-1 text-xs text-slate-300">
                  {amenity}
                </span>
              ))}
              {pg.amenities && pg.amenities.split(", ").length > 4 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="rounded-full bg-brand/10 border border-brand/20 px-2.5 py-1 text-xs text-brand-light hover:bg-brand/20 transition-colors"
                >
                  +{pg.amenities.split(", ").length - 4} more
                </button>
              )}
            </div>
          )}

          {/* Footer: Owner + Actions */}
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal-600 text-xs font-bold text-white">
                {pg.owner_name ? pg.owner_name.charAt(0) : "O"}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Owner</p>
                <p className="text-xs font-semibold text-slate-200">{pg.owner_name || "Manager"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 rounded-full bg-white/5 border border-white/5 px-2.5 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                aria-label="View full details"
              >
                <Expand className="h-3.5 w-3.5" />
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  pg.address + " " + pg.area + " Ahmedabad"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-slate-700/50 border border-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-slate-600 hover:text-white"
                aria-label="View on Google Maps"
              >
                <Map className="h-3.5 w-3.5" />
                Map
              </a>
              <a
                href={`tel:${pg.contact}`}
                className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-2 text-xs font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-dark hover:shadow-brand/40 hover:scale-105"
                aria-label={`Call ${pg.owner_name || "owner"}`}
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {showModal && <PGCardModal pg={pg} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}
