---
title: PG Finder Ahmedabad
emoji: 🏠
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# StayEase AI — Ahmedabad PG Discovery

StayEase AI is a conversational AI companion designed to make finding Paying Guest (PG) accommodations in Ahmedabad simple, stress-free, and immediate. Instead of scrolling through endless static listing sites, filtering through rigid columns, or calling phone numbers just to find out basic details, StayEase AI lets you search, ask questions, and connect with owners directly through natural chat.

---

## 🛑 The Problem

Finding a PG accommodation is a frustrating experience for students and young professionals:
* **Fragmented Listings**: Information is scattered across outdated portals, offline notices, and local brokerage services.
* **Strict Filter Dead-Ends**: Standard websites use rigid search filters. If you check "Wifi", "AC", and "Food" under a tight budget, you get a blank "0 results found" page.
* **Friction in Communication**: To find out simple details (like sharing prices or deposit rules), you have to call owners directly and explain your preferences repeatedly.
* **Time Wasted**: Shortlisting suitable housing takes several weekends of manual calling and in-person visits.

---

## ✨ The Solution: StayEase AI

StayEase AI replaces standard filters with a smart, conversational assistant that acts like a local guide in your pocket:
* **Conversational Discovery**: Just type what you want in plain English (e.g., *"girls PG near Memnagar under 10k"*).
* **Guided Step-by-Step Search**: If you aren't sure what you need, the assistant guides you through a simple 4-step wizard to narrow down options.
* **No More Empty Screens**: If your exact query has no direct match, StayEase AI automatically searches for nearby options or relaxes non-essential constraints to show you the closest matches.
* **Direct Action Cards**: View pricing, sharing options, ratings, and amenities, then tap to call the owner or open their location on Google Maps.

---

## 👤 User Use Cases

### 1. The Direct Searcher
> *"I need a boys PG near Vastrapur under 12,000 INR with food included."*
* **Result**: The system immediately lists matching PG cards matching all preferences.

### 2. The Unsure Explorer
> User starts with *"Help me find a PG"*
* **Result**: The assistant launches an interactive guide, asking one question at a time (Area → Gender → Budget → Ratings) using quick-click recommendation chips.

### 3. The Curious Inquirer
> *"What is the typical deposit rule in Ahmedabad PGs?"* or *"What is the difference between single and double sharing?"*
* **Result**: The assistant provides friendly, context-based answers about local PG norms and suggests search areas to get started.

### 4. The Refiner
> *"Show me cheaper options"* or *"Sort by top rated"*
* **Result**: The assistant automatically adjusts the active search parameters, showing updated lists in real-time.

---

## 🎁 Benefits

* **Find a PG in 3 Minutes**: Replaces hours of manual searching with a fast, conversational shortlist.
* **Verified Information**: Direct access to verified owner names, exact pricing breakdown, and amenities.
* **Intelligent Recommendations**: High-quality matches prioritized based on real reviews and pricing compatibility.
* **Frictionless Contact**: One-tap phone calling and direct Google Maps routing built into every card.

---

## 🚀 Setup & Launch

To run the application locally or in a containerized environment, follow the steps below.

### Local Setup

#### 1. Configure Settings
Create a `.env` file inside `backend/.env` with your API keys:
```env
GROQ_API_KEY=your_groq_api_key
QDRANT_URL=your_qdrant_cloud_url
QDRANT_API_KEY=your_qdrant_cloud_api_key
QDRANT_COLLECTION=pg_listings
```

#### 2. Run Backend (FastAPI)
```bash
cd backend
python -m venv .venv

# Activate environment:
# On Linux/macOS: source .venv/bin/activate
# On Windows: .venv\Scripts\activate

pip install -r requirements.txt
python seed_data.py        # Seed listing records
uvicorn main:app --reload
```
API runs on `http://localhost:8000`.

#### 3. Run Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Application runs on `http://localhost:5173`.

---

### Docker Compose Setup
Run both frontend and backend automatically:
```bash
# Seed listings first
docker compose --profile seed run --rm seed

# Start application
docker compose up --build
```
Access the application at `http://localhost:3000`.
