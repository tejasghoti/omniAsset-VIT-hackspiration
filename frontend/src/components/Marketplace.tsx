import { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';
import { createAtomicSwapGroup, optInToAsset } from '../utils/atomic';

// Mock Listing Data
const MOCK_ASSET_ID = 743543992; // Use a known stable Testnet Asset ID or dynamic
const MOCK_SELLER = "K3T7 ... (System)";
const MOCK_PRICE = 1000000; // 1 ALGO

const Marketplace = () => {
    const { activeAccount, algodClient, transactionSigner } = useWallet();
    const [status, setStatus] = useState<string | null>(null);
    const [step, setStep] = useState<number>(0); // 0=Idle, 1=OptIn, 2=Buy

    const handleBuy = async () => {
        if (!activeAccount || !algodClient) return;

        try {
            // Step 1: Opt-In
            if (step === 0) {
                setStatus("Opting into Asset...");
                await optInToAsset(algodClient, activeAccount.address, MOCK_ASSET_ID, transactionSigner);
                setStatus("Opt-In Successful! Now buying...");
                setStep(1);
                return;
            }

            // Step 2: Atomic Swap
            // Note: In a real app, the Seller would need to sign their part.
            // Here we verify we can CONSTRUCT the group. 
            // Since we don't have the Seller's private key in the browser,
            // we will simulate the "Buyer" part and log the group ID.

            setStatus("Constructing Atomic Group...");
            const txns = await createAtomicSwapGroup(
                algodClient,
                activeAccount.address,
                activeAccount.address, // Buying from Self for Demo (to allow signing both)
                MOCK_ASSET_ID,
                MOCK_PRICE
            );

            // Sign both? Since we used self-to-self for demo, we can sign both.
            // In reality: User signs Txn 0 (Payment). System signs Txn 1 (Asset Transfer).
            const signed = await transactionSigner(txns, [0, 1]); // Sign all

            setStatus("Sending Atomic Swap...");
            const response = await algodClient.sendRawTransaction(signed).do();
            const txId = response.txId;
            await algosdk.waitForConfirmation(algodClient, txId, 4);

            setStatus(`Purchase Successful! TxID: ${txId}`);
            setStep(2);

        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        }
    };

    return (
        <div className="mt-16 text-left max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Live Marketplace</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Mock Item Card */}
                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl hover:border-blue-500 transition-all">
                    <div className="h-48 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                        <span className="text-6xl">🤖</span>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold">OmniGPT-4 (Fineweb)</h3>
                            <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full uppercase tracking-wider">Verified</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            High-fidelity LLM dataset optimized for finance.
                            Includes 10B tokens cleaned and tokenized.
                        </p>

                        <div className="flex justify-between items-center mb-6 font-mono">
                            <div className="text-gray-500 text-sm">Price</div>
                            <div className="text-xl font-bold text-green-400">10 ALGO</div>
                        </div>

                        {!activeAccount ? (
                            <button disabled className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed">
                                Connect Wallet to Buy
                            </button>
                        ) : (
                            <button
                                onClick={handleBuy}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                            >
                                {step === 0 ? "Buy Now (Opt-In)" : step === 1 ? "Confirm Purchase" : "Purchased!"}
                            </button>
                        )}

                        {status && (
                            <div className="mt-4 text-xs font-mono text-yellow-400 break-words">
                                {'>'} {status}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Panel */}
                <div className="p-8 bg-gray-800/50 rounded-2xl border border-gray-700">
                    <h3 className="text-xl font-bold text-gray-300 mb-4">Atomic Swap Mechanics</h3>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li className="flex gap-3">
                            <span className="bg-green-900/50 text-green-400 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</span>
                            <span>
                                <strong className="text-white block mb-1">Payment Transaction</strong>
                                Buyer sends <span className="text-green-400">10 ALGO</span> to Seller.
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-green-900/50 text-green-400 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</span>
                            <span>
                                <strong className="text-white block mb-1">Asset Transfer</strong>
                                Seller sends <span className="text-blue-400">1 Unit</span> of Asset to Buyer.
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-purple-900/50 text-purple-400 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0">3</span>
                            <span>
                                <strong className="text-white block mb-1">Atomic Execution</strong>
                                Both transactions are grouped. If one fails, <span className="text-red-400">both fail</span>.
                                Zero counterparty risk.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Marketplace;
