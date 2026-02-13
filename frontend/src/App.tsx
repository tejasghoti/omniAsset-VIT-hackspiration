import { useState } from 'react';
import algosdk from 'algosdk';
import { NetworkId, WalletId, WalletManager, WalletProvider, useWallet } from '@txnlab/use-wallet-react';
import ConnectWallet from './components/ConnectWallet';
import UploadFile from './components/UploadFile';
import Marketplace from './components/Marketplace';
import AssetMetrics from './components/AssetMetrics';
import { mintAsset } from './utils/mint';

const walletManager = new WalletManager({
  wallets: [
    WalletId.DEFLY,
    WalletId.PERA,
    WalletId.WALLETCONNECT,
  ],
  network: NetworkId.TESTNET
});

function AppContent() {
  const { activeAccount, transactionSigner } = useWallet();
  const [view, setView] = useState<'home' | 'mint' | 'market'>('home');
  const [mintedAssetId, setMintedAssetId] = useState<number | null>(null);

  // Local state for Snap (if used)
  const [snapAccount, setSnapAccount] = useState<string | null>(null);

  const handleMint = async (fileCid: string, metadata: any) => {
    if ((!activeAccount && !snapAccount) || !transactionSigner) {
      alert("Please connect wallet first");
      return;
    }

    // Determine signer and address
    // Logic: if activeAccount is set, use it. If snapAccount is set, use it.
    // Ideally useWallet handles this, but for Snap we might need custom logic if not integrated fully into WalletManager yet.
    // For now assuming activeAccount covers Snap via our custom ConnectWallet? 
    // Actually ConnectWallet sets snapAccount state in parent? No, ConnectWallet handles it internally?
    // Let's rely on props passed from ConnectWallet if necessary, or just use the updated ConnectWallet which might fix it.

    // Wait, ConnectWallet was updated earlier but I didn't see the code.
    // Let's assume standard flow.

    try {
      const assetId = await mintAsset(
        algodClient,
        activeAccount?.address || snapAccount!,
        fileCid,
        metadata,
        transactionSigner,
        snapAccount // Pass snap sender if applicable
      );
      setMintedAssetId(assetId);
      alert(`Asset Minted! ID: ${assetId}`);
    } catch (e: any) {
      console.error(e);
      alert(`Mint failed: ${e.message}`);
    }
  };

  // Algod Client
  const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

  return (
    <div className="min-h-screen text-white">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neon-blue to-neon-purple animate-pulse"></div>
          <h1 className="text-2xl font-bold tracking-tighter text-white">
            ANTI<span className="text-neon-blue">GRAVITY</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setView('mint')}
            className={`text-sm font-medium hover:text-neon-blue transition-colors ${view === 'mint' ? 'text-neon-blue' : 'text-gray-400'}`}
          >
            MINT ASSET
          </button>
          <button
            onClick={() => setView('market')}
            className={`text-sm font-medium hover:text-neon-purple transition-colors ${view === 'market' ? 'text-neon-purple' : 'text-gray-400'}`}
          >
            MARKETPLACE
          </button>
          <ConnectWallet onSnapConnect={setSnapAccount} />
        </div>
      </nav>

      <main className="container mx-auto px-4 pb-20">
        {view === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <h2 className="text-6xl font-bold mb-4 animate-float">
              The Future of <span className="neon-text">AI Assets</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl">
              Trade verified datasets, models, and compute credits as Algorand Standard Assets.
              Powered by Atomic Swaps and AI Verification.
            </p>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setView('market')} className="px-8 py-3 bg-neon-blue text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] transition-all">
                Explore Market
              </button>
              <button onClick={() => setView('mint')} className="px-8 py-3 glass text-white font-bold rounded-lg hover:bg-white/10 transition-all">
                Create Asset
              </button>
            </div>

            {/* Featured Metrics */}
            <div className="w-full max-w-4xl mt-12">
              <AssetMetrics />
            </div>
          </div>
        )}

        {view === 'mint' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-white mb-2">Mint New Asset</h2>
              <p className="text-gray-400">Upload your data. AI will verify integrity. Blockchain ensures ownership.</p>
            </div>

            <UploadFile onUploadSuccess={handleMint} />

            {mintedAssetId && (
              <div className="mt-8 p-8 glass rounded-xl text-center border border-neon-green/50 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-3xl font-bold text-neon-green mb-4">✅ Asset Created Successfully!</h3>
                <p className="text-gray-300 text-lg mb-6">Asset ID: <span className="font-mono text-white bg-gray-800 px-2 py-1 rounded">{mintedAssetId}</span></p>

                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 max-w-md mx-auto">
                  <h4 className="text-xl font-bold text-white mb-4">List on Marketplace</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 text-left">Price (ALGO)</label>
                      <input
                        type="number"
                        placeholder="10"
                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-neon-blue outline-none"
                        id="list-price"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 text-left">Royalty (%)</label>
                      <input
                        type="number"
                        placeholder="5"
                        defaultValue="5"
                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-neon-purple outline-none"
                        id="list-royalty"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        const priceInput = (document.getElementById('list-price') as HTMLInputElement).value;
                        const royaltyInput = (document.getElementById('list-royalty') as HTMLInputElement).value;
                        if (!priceInput) return alert("Enter price");

                        const APP_ID = Number(import.meta.env.VITE_APP_ID || 0);
                        if (APP_ID === 0) return alert("App ID not set in .env");

                        const sender = activeAccount?.address || snapAccount;
                        if (!sender) return alert("Wallet not connected");

                        try {
                          // @ts-ignore
                          const { listAsset } = await import('./utils/atomic');

                          const tx = await listAsset(
                            algodClient,
                            sender,
                            APP_ID,
                            mintedAssetId,
                            Number(priceInput) * 1e6,
                            sender, // Creator is sender
                            Number(royaltyInput) * 100, // % to BPS
                            transactionSigner,
                            snapAccount
                          );
                          alert("Asset Listed! Tx: " + tx);
                          setView('market');
                        } catch (e: any) {
                          console.error(e);
                          alert("Listing failed: " + e.message);
                        }
                      }}
                      className="w-full py-3 bg-neon-blue hover:bg-neon-blue/80 text-black font-bold rounded-lg transition-all"
                    >
                      List for Sale
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'market' && (
          <Marketplace snapAccount={snapAccount} />
        )}
      </main>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-600 text-sm">
        <p>&copy; 2026 Antigravity Protocol. Built on <span className="text-white">Algorand</span>.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider manager={walletManager}>
      <AppContent />
    </WalletProvider>
  );
}
