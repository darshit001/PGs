// Shared helpers for working with PG listing objects.
// Metadata comes from the backend as strings (e.g. food_included: "True").

export function pgKey(pg) {
  if (!pg) return "";
  return String(pg.id || `${pg.name || ""}-${pg.address || ""}`);
}

export function minPrice(pg) {
  const prices = [pg?.single_price, pg?.double_price, pg?.triple_price]
    .map((p) => parseInt(p, 10))
    .filter((p) => Number.isFinite(p) && p > 0);
  return prices.length ? Math.min(...prices) : 0;
}

export function ratingOf(pg) {
  const r = parseFloat(pg?.rating);
  return Number.isFinite(r) ? r : 0;
}

export function amenityList(pg) {
  return pg?.amenities ? pg.amenities.split(", ").filter(Boolean) : [];
}

export function mapsUrl(pg) {
  const q = `${pg?.address || ""} ${pg?.area || ""} Ahmedabad`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
