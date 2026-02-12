import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NetworkId, WalletId, WalletManager } from '@txnlab/use-wallet'
import { WalletProvider } from '@txnlab/use-wallet-react'
import './index.css'
import App from './App.tsx'

const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY,
    WalletId.EXODUS,
    WalletId.WALLETCONNECT,
  ],
  defaultNetwork: NetworkId.TESTNET,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider manager={walletManager}>
      <App />
    </WalletProvider>
  </StrictMode>,
)
