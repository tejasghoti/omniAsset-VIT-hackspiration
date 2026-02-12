import { useWallet } from '@txnlab/use-wallet-react';
import { useState } from 'react';

const ConnectWallet = () => {
    const { wallets, activeAccount } = useWallet();
    const [isOpen, setIsOpen] = useState(false);

    // If connected, show address and disconnect
    if (activeAccount) {
        return (
            <div className="flex flex-col items-center gap-2">
                <p className="text-green-400 font-mono text-sm break-all">
                    Connected: {activeAccount.address.slice(0, 6)}...{activeAccount.address.slice(-6)}
                </p>
                <button
                    onClick={() => wallets?.find(w => w.isActive)?.disconnect()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
                Connect Wallet
            </button>

            {isOpen && (
                <div className="absolute mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 z-50">
                    <h3 className="text-gray-300 text-sm font-semibold mb-3 uppercase tracking-wider">Select Wallet</h3>
                    <div className="space-y-2">
                        {wallets?.map((wallet) => (
                            <button
                                key={wallet.id}
                                onClick={() => wallet.connect()}
                                className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                            >
                                <img
                                    src={wallet.metadata.icon}
                                    alt={wallet.metadata.name}
                                    className="w-8 h-8 object-contain"
                                />
                                <span className="font-medium text-white">{wallet.metadata.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectWallet;
