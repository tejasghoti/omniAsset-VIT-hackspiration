import { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'
import ConnectWallet from './components/ConnectWallet'
import UploadFile from './components/UploadFile'
import Marketplace from './components/Marketplace'
import { mintAsset } from './utils/mint'
import './App.css'

function App() {
  const { activeAccount, algodClient, transactionSigner } = useWallet()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [assetId, setAssetId] = useState<string | null>(null)

  const handleUploadSuccess = async (cid: string, metadata: any) => {
    if (!activeAccount || !algodClient) return

    setLoading(true)
    setStatus('File uploaded & verified! Minting Asset on Algorand...')

    try {
      const txId = await mintAsset(
        algodClient,
        activeAccount.address,
        cid,
        metadata,
        transactionSigner
      )

      setStatus(`Minting successful! TxID: ${txId}. Waiting for confirmation...`)

      // confirm transaction
      const result = await algosdk.waitForConfirmation(algodClient, txId, 4)
      const assetIndex = result['asset-index'] || result.assetIndex
      setAssetId(assetIndex ? assetIndex.toString() : 'Unknown')
      setStatus('Asset Minted Successfully!')

    } catch (error: any) {
      console.error(error)
      setStatus(`Minting failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
                O
              </div>
              <span className="text-xl font-bold tracking-tight">OmniAsset</span>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent pb-2">
            The Marketplace for<br />AI Models & Datasets
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Decentralized, verifiable, and instant. Built on Algorand for the future of AI commerce.
          </p>

          {!activeAccount ? (
            <div className="mt-12 p-8 bg-gray-800/50 rounded-2xl border border-gray-700 max-w-xl mx-auto">
              <p className="text-lg text-gray-300 mb-6">Connect your wallet to start uploading and minting AI assets.</p>
              <div className="animate-pulse text-blue-400 font-mono">Waiting for connection...</div>
            </div>
          ) : (
            <div className="mt-12 space-y-16">
              {/* Minting Section */}
              <section>
                {!assetId ? (
                  <>
                    <UploadFile onUploadSuccess={handleUploadSuccess} />
                    {loading && (
                      <div className="mt-4 p-4 bg-blue-900/20 text-blue-300 rounded-lg max-w-md mx-auto border border-blue-800">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          {status || 'Processing...'}
                        </div>
                      </div>
                    )}
                    {status && !loading && !assetId && (
                      <div className="mt-4 p-4 bg-red-900/20 text-red-300 rounded-lg max-w-md mx-auto border border-red-800">
                        {status}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 bg-green-900/20 border border-green-700/50 rounded-2xl max-w-xl mx-auto shadow-2xl shadow-green-900/20">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-3xl font-bold text-green-400 mb-2">Asset Minted!</h3>
                    <p className="text-gray-300 mb-6">Your AI Asset is now secured on Algorand.</p>

                    <div className="bg-gray-900/80 p-6 rounded-xl font-mono text-sm break-all border border-gray-700">
                      <div className="text-gray-500 mb-1">Asset ID</div>
                      <div className="text-yellow-400 font-bold text-xl">{assetId}</div>
                      <div className="mt-4 text-gray-500 mb-1">Explore</div>
                      <a
                        href={`https://lora.algokit.io/testnet/asset/${assetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        View on Lora
                      </a>
                    </div>

                    <button
                      onClick={() => { setAssetId(null); setStatus(null); }}
                      className="mt-8 px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all font-bold text-white hover:scale-105 active:scale-95"
                    >
                      Mint Another Asset
                    </button>
                  </div>
                )}
              </section>

              {/* Marketplace Section */}
              <section>
                <div className="w-full h-px bg-gray-800 mb-16"></div>
                <Marketplace />
              </section>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
            <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700 hover:border-blue-500 transition-colors group">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-blue-400 text-2xl group-hover:scale-110 transition-transform">
                🔗
              </div>
              <h3 className="text-xl font-bold mb-2">Connect & Mint</h3>
              <p className="text-gray-400">Upload your datasets/models to IPFS and mint them as ASAs in seconds.</p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700 hover:border-purple-500 transition-colors group">
              <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 text-purple-400 text-2xl group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <h3 className="text-xl font-bold mb-2">Verify Quality</h3>
              <p className="text-gray-400">AI-powered fingerprinting ensures uniqueness and quality before listing.</p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700 hover:border-green-500 transition-colors group">
              <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center mb-4 text-green-400 text-2xl group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="text-xl font-bold mb-2">Atomic Buy</h3>
              <p className="text-gray-400">Instant, trustless exchanges using Algorand Atomic Transfers.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
