import { useWallet } from '@txnlab/use-wallet-react';
import { useState, useEffect } from 'react';
import { connectSnap, getSnapAccount } from '../utils/snap';
import { motion, AnimatePresence } from 'framer-motion';

interface ConnectWalletProps {
    onSnapConnect?: (address: string | null) => void;
    snapAccount?: string | null; // Passed from parent or managed here? 
    // In App.tsx we manage snapAccount state.
}

const ConnectWallet = ({ onSnapConnect, snapAccount }: ConnectWalletProps) => {
    const { wallets, activeAccount } = useWallet();
    const [isOpen, setIsOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Initial check (optional, if we want to auto-connect snap on load if authorized, but usually manual)

    const handleConnectSnap = async () => {
        setIsConnecting(true);
        try {
            const account = await connectSnap();
            if (account && onSnapConnect) {
                // account is typically { address: string, ... }
                // Let's assume the snap returns user's account info. 
                // We need the address string.
                const addr = (account as any).address || (account as any).publicKey;
                onSnapConnect(addr);
                setIsOpen(false);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to connect Snap");
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectSnap = () => {
        if (onSnapConnect) onSnapConnect(null);
    };

    const connectedAddress = activeAccount?.address || snapAccount;

    return (
        <div className="relative z-50">
            {!connectedAddress ? (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="px-6 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple text-black font-bold rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(189,0,255,0.6)] transition-all flex items-center gap-2"
                >
                    <span>⚡</span>
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
            ) : (
                <div className="flex items-center gap-4 bg-gray-900/80 border border-neon-blue/30 rounded-full px-4 py-1.5 backdrop-blur-md">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Connected</span>
                        <span className="text-neon-blue font-mono text-sm">
                            {connectedAddress.slice(0, 4)}...{connectedAddress.slice(-4)}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            if (activeAccount) wallets?.find(w => w.isActive)?.disconnect();
                            if (snapAccount) disconnectSnap();
                        }}
                        className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                        title="Disconnect"
                    >
                        ✕
                    </button>
                </div>
            )}

            <AnimatePresence>
                {isOpen && !connectedAddress && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-3 w-72 glass rounded-xl border border-gray-700 shadow-2xl p-4 overflow-hidden"
                    >
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 px-1">Select Provider</h3>

                        <div className="space-y-2">
                            {/* MetaMask Snap */}
                            <button
                                onClick={handleConnectSnap}
                                className="w-full flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-orange-500/20 border border-transparent hover:border-orange-500/50 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl shadow-lg">🦊</div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-200 group-hover:text-orange-400">MetaMask Snap</div>
                                    <div className="text-xs text-gray-500">For MetaMask Users</div>
                                </div>
                            </button>

                            <div className="h-px bg-gray-700/50 my-2" />

                            {/* Other Wallets */}
                            {wallets?.map((wallet) => (
                                <button
                                    key={wallet.id}
                                    onClick={() => {
                                        wallet.connect();
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-neon-blue/10 border border-transparent hover:border-neon-blue/50 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                        <img src={wallet.metadata.icon} alt={wallet.metadata.name} className="w-6 h-6 object-contain" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-200 group-hover:text-neon-blue">{wallet.metadata.name}</div>
                                        <div className="text-xs text-gray-500">Algorand Native</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ConnectWallet;
