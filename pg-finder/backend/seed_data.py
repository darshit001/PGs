import json
from pathlib import Path

from chroma_store import upsert_documents


DATA_FILES = [
    "ahmedabad_pg_north_listings.json",
]


def _normalize_payload(raw):
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and isinstance(raw.get("listings"), list):
        return raw["listings"]
    raise ValueError("Unsupported listing file format. Expected list or {'listings': [...]}.")


def _load_all_pgs(base_dir: Path):
    all_pgs = []
    for file_name in DATA_FILES:
        path = base_dir / file_name
        if not path.exists():
            raise FileNotFoundError(f"Missing data file: {path}")

        with path.open("r", encoding="utf-8") as f:
            payload = json.load(f)

        all_pgs.extend(_normalize_payload(payload))

    return all_pgs


def seed():
    base_dir = Path(__file__).resolve().parent
    pgs = _load_all_pgs(base_dir)

    documents = []
    metadatas = []
    ids = []

    for pg in pgs:
        doc_text = f"""
        PG Name: {pg['name']}
        Area: {pg['area']}
        Address: {pg['address']}
        Landmark: {pg.get('landmark', '')}
        Gender: {pg.get('gender', 'N/A')}
        Type: {pg.get('type', 'N/A')}
        Rating: {pg.get('rating', 'N/A')}
        Suitable For: {', '.join(pg.get('suitable_for', []))}
        Amenities: {', '.join(pg.get('amenities', []))}
        Food Included: {pg.get('food_included', False)}
        Food Type: {pg.get('food_type', 'N/A')}
        Single Sharing Price: {pg.get('pricing', {}).get('single_sharing', 'N/A')} INR/month
        Double Sharing Price: {pg.get('pricing', {}).get('double_sharing', 'N/A')} INR/month
        Triple Sharing Price: {pg.get('pricing', {}).get('triple_sharing', 'N/A')} INR/month
        Availability: {pg.get('availability', 'N/A')}
        """

        documents.append(doc_text.strip())
        metadatas.append(
            {
                "id": pg.get("id", ""),
                "name": pg.get("name", ""),
                "area": pg.get("area", ""),
                "address": pg.get("address", ""),
                "contact": pg.get("contact", ""),
                "owner_name": pg.get("owner_name", ""),
                "gender": pg.get("gender", ""),
                "rating": float(pg.get("rating", 0.0) or 0.0),
                "single_price": int(pg.get("pricing", {}).get("single_sharing", 0) or 0),
                "double_price": int(pg.get("pricing", {}).get("double_sharing", 0) or 0),
                "triple_price": int(pg.get("pricing", {}).get("triple_sharing", 0) or 0),
                "amenities": ", ".join(pg.get("amenities", [])),
                "food_included": pg.get("food_included", False),
                "food_type": pg.get("food_type", "N/A"),
                "suitable_for": ", ".join(pg.get("suitable_for", [])),
                "availability": pg.get("availability", "N/A"),
                "deposit": int(pg.get("deposit", 0) or 0),
                "total_reviews": int(pg.get("total_reviews", 0) or 0),
            }
        )
        ids.append(str(pg.get("id", "")))

    upsert_documents(documents=documents, metadatas=metadatas, ids=ids)
    print(f"Seeded {len(pgs)} PG listings into Qdrant.")


if __name__ == "__main__":
    seed()
