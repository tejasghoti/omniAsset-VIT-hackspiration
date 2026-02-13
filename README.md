# 🌌 Antigravity: The Ultimate Web3 AI Marketplace

**Antigravity** is a "Web3 Sexy" decentralized application (dApp) built on **Algorand**, designed for trading AI models and datasets. It features a stunning glassmorphism UI, AI-driven price oracles, and secure atomic swaps.

## 🚀 Key Features

### 1. 🧠 AI Integration
-   **AI Price Oracle**: Automatically suggests fair market value for uploaded assets based on data metrics (Size, Type).
-   **Recommendations**: "For You" section in the marketplace highlighting assets that match user behavior (Mocked).
-   **Data Metrics**: Interactive charts (Radar/Bar) visualizing dataset integrity and distribution.

### 2. 💎 Web3 Sexy UI
-   **Glassmorphism**: Sleek, translucent cards with neon accents using Tailwind CSS v4.
-   **Animations**: Smooth transitions powered by `framer-motion`.
-   **Responsive**: Fluid layout optimized for 4K and mobile.

### 3. ⛓️ Blockchain (Algorand)
-   **Smart Contracts**: Located in `/blockchain/contracts/`.
    -   Written in **Puya** (Python).
    -   Implements **Atomic Transfers** for trustless P2P exchange.
-   **ASA Minting**: One-click minting of assets with IPFS-pinned metadata.
-   **Wallet Connect**: Support for Pera, Defly, and **MetaMask Snaps**.

## 📂 Project Structure

```
.
├── blockchain/
│   └── contracts/       # Smart Contract Logic (Puya) & Artifacts
├── backend/             # Node.js Server (IPFS / API)
├── frontend/            # React + Vite + Tailwind v4 Application
└── README.md
```

## 🛠️ Setup & Run

### 1. Smart Contracts
Deploy the marketplace contract to TestNet.
```bash
cd blockchain/contracts
# Ensure venv is active
python deploy.py
```
*Copy the App ID output.*

### 2. Backend
Start the IPFS handler.
```bash
cd backend
npm install
node index.js
```

### 3. Frontend
Run the sleek Web3 interface.
```bash
cd frontend
# Install new dependencies (framer-motion, recharts)
npm install
# Set App ID in .env
# VITE_APP_ID=...
npm run dev
```

## 📜 License
MIT
