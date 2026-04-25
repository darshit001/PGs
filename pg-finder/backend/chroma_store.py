import os
from typing import Any

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models

load_dotenv()

QDRANT_URL = os.environ.get("QDRANT_URL")
QDRANT_API_KEY = os.environ.get("QDRANT_API_KEY")
COLLECTION_NAME = os.environ.get("QDRANT_COLLECTION", "pg_listings")

if not QDRANT_URL or not QDRANT_API_KEY:
    raise RuntimeError("Missing Qdrant config. Set QDRANT_URL and QDRANT_API_KEY in backend/.env")

# Initialize Qdrant and set FastEmbed models for TRUE HYBRID SEARCH
qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
qdrant_client.set_model("BAAI/bge-small-en-v1.5")
qdrant_client.set_sparse_model("Qdrant/bm25")

def upsert_documents(documents: list[str], metadatas: list[dict[str, Any]], ids: list[str]) -> None:
    # Delete the old dense-only collection
    if qdrant_client.collection_exists(COLLECTION_NAME):
        qdrant_client.delete_collection(COLLECTION_NAME)
        
    print("Rebuilding Qdrant Collection with Dense + Sparse Hybrid Index...")

    numeric_ids = [abs(hash(idx)) % (10**9) for idx in ids]
    
    # qdrant_client.add() automatically batches and embeds dense/sparse vectors if models are set
    qdrant_client.add(
        collection_name=COLLECTION_NAME,
        documents=documents,
        metadata=metadatas,
        ids=numeric_ids,
    )


def search_pgs(query: str, n_results: int = 10, metadata_filter: models.Filter | None = None):
    # This invokes native Reciprocal Rank Fusion (RRF) between exact BM25 keywords and deep semantic meaning
    results = qdrant_client.query(
        collection_name=COLLECTION_NAME,
        query_text=query,
        limit=n_results,
        query_filter=metadata_filter
    )
    
    scored_items = []
    for item in results:
        metadata = dict(item.metadata or {})
        doc = metadata.pop("document", "")
        if "id" not in metadata and item.id:
            metadata["id"] = str(item.id)
            
        scored_items.append((float(item.score), doc, metadata))

    return {
        "documents": [[item[1] for item in scored_items]],
        "metadatas": [[item[2] for item in scored_items]],
        "distances": [[item[0] for item in scored_items]],
    }
