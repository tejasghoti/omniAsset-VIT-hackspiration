import { useEffect, useState } from 'react';
import algosdk from 'algosdk';
import { useWallet } from '@txnlab/use-wallet-react';
import { buyAssetAtomic, cancelListing } from '../utils/atomic';
import { motion, AnimatePresence } from 'framer-motion';

// App ID from environment or hardcoded (deployed contract)
const APP_ID = Number(import.meta.env.VITE_APP_ID || 0);

interface Listing {
    assetId: number;
    seller: string;
    price: number;
    assetName?: string;
    unitName?: string;
    isRecommended?: boolean; // AI feature
    creator?: string;
    royalty?: number;
}

const Marketplace = ({ snapAccount }: { snapAccount?: string | null }) => {
    const { activeAccount, algodClient, transactionSigner } = useWallet();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const [buying, setBuying] = useState<number | null>(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchListings();
    }, [algodClient]);

    const fetchListings = async () => {
        if (!algodClient || APP_ID === 0) return;
        setLoading(true);

        try {
            const boxes = await algodClient.getApplicationBoxes(APP_ID).do();
            const parsedListings: Listing[] = [];

            for (const box of boxes.boxes) {
                const assetId = algosdk.decodeUint64(box.name, 'safe');
                const boxValue = await algodClient.getApplicationBoxByName(APP_ID, box.name).do();
                const value = boxValue.value;

                // ListingInfo: Seller (32) + Price (8) + Creator (32) + Royalty (8) = 80 bytes
                if (value.length !== 80) continue;

                const seller = algosdk.encodeAddress(value.slice(0, 32));
                const price = algosdk.decodeUint64(value.slice(32, 40), 'safe');
                const creator = algosdk.encodeAddress(value.slice(40, 72));
                const royalty = algosdk.decodeUint64(value.slice(72, 80), 'safe');

                let assetName = `Asset #${assetId}`;
                let unitName = 'ASA';
                try {
                    const assetInfo = await algodClient.getAssetByID(assetId).do();
                    assetName = assetInfo.params.name || assetName;
                    // @ts-ignore
                    unitName = assetInfo.params['unit-name'] || assetInfo.params.unitName || unitName;
                } catch (e) { }

                // AI Recommendation Mock
                const isRecommended = Math.floor(Math.random() * 10) > 7;

                parsedListings.push({ assetId, seller, price, assetName, unitName, isRecommended, creator, royalty });
            }
            setListings(parsedListings);
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async (listing: Listing) => {
        const buyerAddr = activeAccount?.address || snapAccount;
        if (!buyerAddr || !algodClient) {
            alert("Connect wallet to buy");
            return;
        }

        setBuying(listing.assetId);
        try {
            // New buyAssetAtomic signature
            const txID = await buyAssetAtomic(
                algodClient,
                buyerAddr,
                listing.assetId,
                listing.price,
                APP_ID,
                transactionSigner,
                snapAccount
            );
            alert(`Purchase Successful! Tx: ${txID}`);
            fetchListings();
        } catch (e: any) {
            console.error(e);
            alert(`Buy failed: ${e.message}`);
        } finally {
            setBuying(null);
        }
    };

    const handleCancel = async (listing: Listing) => {
        const sender = activeAccount?.address || snapAccount;
        if (!sender || !algodClient) {
            alert("Connect wallet to cancel");
            return;
        }

        if (confirm(`Cancel listing for ${listing.assetName}?`)) {
            setBuying(listing.assetId);
            try {
                const txID = await cancelListing(
                    algodClient,
                    sender,
                    APP_ID,
                    listing.assetId,
                    transactionSigner,
                    snapAccount
                );
                alert(`Listing Cancelled! Tx: ${txID}`);
                fetchListings();
            } catch (e: any) {
                console.error(e);
                alert(`Cancel failed: ${e.message}`);
            } finally {
                setBuying(null);
            }
        }
    };

    const recommended = listings.filter(l => l.isRecommended);
    const filteredListings = listings; // Add real filter logic if needed

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-12">

            {/* AI Recommendations Section */}
            {recommended.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-2xl">✨</span>
                        <h2 className="text-2xl font-bold neon-text">AI Recommended for You</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommended.slice(0, 3).map((l, i) => (
                            <motion.div
                                key={`rec-${l.assetId}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass rounded-xl p-1 neon-border relative group"
                            >
                                <div className="absolute top-0 right-0 bg-neon-purple text-xs font-bold px-2 py-1 rounded-bl-lg text-white z-10">
                                    AI MATCH 98%
                                </div>
                                <div className="bg-gray-900/80 rounded-lg p-6 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-xl text-white">{l.assetName}</h3>
                                            <span className="text-xs font-mono text-gray-400">ID: {l.assetId}</span>
                                        </div>
                                        <div className="h-32 bg-gray-800/50 rounded-lg flex items-center justify-center mb-4 text-4xl">
                                            🧬
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-neon-blue font-mono font-bold">{(l.price / 1e6).toFixed(2)} ALGO</span>
                                        <button
                                            onClick={() => handleBuy(l)}
                                            disabled={!!buying}
                                            className="px-4 py-2 bg-neon-purple/20 hover:bg-neon-purple/40 text-neon-purple border border-neon-purple/50 rounded-lg transition-all"
                                        >
                                            {buying === l.assetId ? 'Minting...' : 'Buy Now'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Main Marketplace */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-white">Explore Assets</h2>
                    <div className="flex gap-2">
                        {['All', 'Image', 'Text', 'Model'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 glass rounded-full text-sm transition-colors ${filter === f ? 'text-neon-blue border-neon-blue' : 'text-gray-400 hover:text-white'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {APP_ID === 0 && (
                    <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/50 text-red-300 text-center">
                        Smart Contract App ID is missing.
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass h-64 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredListings.map((l) => (
                                <motion.div
                                    key={l.assetId}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="glass rounded-xl overflow-hidden group hover:neon-border transition-all duration-300"
                                >
                                    <div className="h-40 bg-gray-800/50 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                                        📦
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-gray-200 mb-1 truncate">{l.assetName}</h3>
                                        <p className="text-xs text-gray-500 mb-4">{l.unitName}</p>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400">Price</span>
                                                <span className="font-bold text-neon-green">{(l.price / 1e6).toFixed(1)} A</span>
                                            </div>

                                            {(activeAccount?.address === l.seller || snapAccount === l.seller) ? (
                                                <button
                                                    onClick={() => handleCancel(l)}
                                                    disabled={!!buying}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm transition-all"
                                                >
                                                    {buying === l.assetId ? 'Cancelling...' : 'Cancel'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBuy(l)}
                                                    disabled={!!buying}
                                                    className="px-3 py-1.5 bg-gray-700 hover:bg-neon-blue hover:text-black text-white text-sm rounded-lg transition-colors font-medium cursor-pointer"
                                                >
                                                    {buying === l.assetId ? 'Processing...' : 'Buy Now'}
                                                </button>
                                            )}
                                        </div>

                                        {l.royalty && l.royalty > 0 && (
                                            <div className="mt-3 pt-2 border-t border-gray-700/50 flex justify-between text-[10px] uppercase tracking-wide text-gray-500">
                                                <span>👑 Royalty</span>
                                                <span className="text-neon-purple font-mono">{(l.royalty / 100)}%</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Marketplace;
