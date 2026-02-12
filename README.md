# 🌐 OmniAsset: The AI Model & Dataset Marketplace
> _"Amazon meets Nasdaq for the AI Era, built on Algorand."_

OmniAsset is a decentralized marketplace that allows AI researchers and developers to securely monetize their datasets and models. Leveraging Algorand's speed and atomic transfers, we bridge the gap between AI creation and fair compensation.

![OmniAsset Banner](https://placehold.co/1200x400/101827/3b82f6?text=OmniAsset+Marketplace)

## 🚀 Key Features

- **🔗 Wallet Connect**: Seamless login with **Pera**, **Defly**, or **Exodus** (Testnet).
- **📂 IPFS Integration**: Decentralized storage for large datasets/models via **Pinata**.
- **🧠 AI Verification (Mock)**: Automated quality checks and fingerprinting to prevent duplicates (Mocked for MVP).
- **💎 Instant Minting**: One-click minting of assets as **ARC-69** Algorand Standard Assets (ASAs).
- **⚡ Atomic Swaps**: Trustless, P2P purchasing. Buyer sends ALGO, Seller sends Asset—simultaneously. No middlemen.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, `@txnlab/use-wallet`
- **Backend**: Node.js, Express, Multer
- **Blockchain**: Algorand (Testnet), `algosdk`
- **Storage**: IPFS (Pinata SDK)

## 📦 Installation & Run Guide

### Prerequisites
- Node.js (v18+)
- An Algorand Wallet (Pera/Defly) connected to **Testnet**.
- [Pinata](https://www.pinata.cloud/) API Keys (Free Tier).

### 1. Backend Setup (Terminal 1)
Handles file uploads and IPFS pinning.

```bash
cd backend
npm install
```

**Configuration**:
Create a `.env` file in the `backend` folder:
```
PINATA_API_KEY=your_key_here
PINATA_SECRET_KEY=your_secret_here
PORT=3001
```

**Run**:
```bash
node index.js
```

### 2. Frontend Setup (Terminal 2)
Launches the Marketplace UI.

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🎮 How to Demo

1.  **Connect**: Click "Connect Wallet" top right.
2.  **Upload**: Choose a file (e.g., a dataset sample). Watch it upload to IPFS.
3.  **Mint**: Approve the transaction to mint your "AI Asset" on Algorand.
4.  **Buy**: Scroll to the **Marketplace** section. Click "Buy Now" to simulate a buyer purchasing the asset via Atomic Transfer.

## 📜 Smart Contract Logic (Future Work)
Currently, the atomic swap is constructed on the client-side for demonstration. Future versions will implement a Smart Contract (Application) to handle escrow and automated royalties.

---
*Built with ❤️ for the VIT Hackathon.*
