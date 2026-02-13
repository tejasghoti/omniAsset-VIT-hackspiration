import { useState } from 'react';

const UploadFile = ({ onUploadSuccess }: { onUploadSuccess: (cid: string, metadata: any) => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [predictedPrice, setPredictedPrice] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setError(null);
            analyzeFile(selectedFile);
        }
    };

    const analyzeFile = (f: File) => {
        setAnalyzing(true);
        // Mock AI Oracle
        setTimeout(() => {
            const basePrice = 10;
            const sizeFactor = f.size / 1024 / 1024; // MB
            const typeFactor = f.type.includes('image') ? 2 : 1;
            const price = (basePrice + (sizeFactor * 5) * typeFactor).toFixed(2);
            setPredictedPrice(price);
            setAnalyzing(false);
        }, 1500);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('description', 'Uploaded via OmniAsset');
        // In a real app, we'd send the predicted price as metadata too

        try {
            const response = await fetch('http://localhost:3001/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const checkJson = await response.json();
            onUploadSuccess(checkJson.fileCid, checkJson.metadata);
            setUploading(false);
            setFile(null);
            setPredictedPrice(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Upload failed');
            setUploading(false);
        }
    };

    return (
        <div className="p-8 glass rounded-2xl max-w-md mx-auto mt-10 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-neon-purple"></div>

            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📤</span> Upload Dataset
            </h3>

            <div className="flex flex-col gap-6">
                <div className="relative border-2 border-dashed border-gray-600 rounded-xl p-8 hover:border-neon-blue transition-colors text-center group-hover:bg-gray-800/30">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-gray-400">
                        {file ? (
                            <span className="font-mono text-neon-blue">{file.name}</span>
                        ) : (
                            <span>Drag & drop or click to select</span>
                        )}
                    </div>
                </div>

                {/* AI Oracle Result */}
                {(analyzing || predictedPrice) && (
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <span className="text-sm text-gray-400">AI Price Oracle</span>
                        {analyzing ? (
                            <span className="text-neon-blue animate-pulse text-sm">Analyzing Data Structure...</span>
                        ) : (
                            <div className="text-right">
                                <span className="block text-xl font-bold text-neon-green">{predictedPrice} ALGO</span>
                                <span className="text-xs text-gray-500">Suggested Fair Market Value</span>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-500/30">
                        Error: {error}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className={`w-full py-3 px-4 rounded-lg font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${!file || uploading
                        ? 'bg-gray-700 cursor-not-allowed text-gray-500'
                        : 'bg-gradient-to-r from-neon-blue to-neon-purple text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]'
                        }`}
                >
                    {uploading ? 'Pinning to IPFS...' : 'Mint to Blockchain'}
                </button>
            </div>
        </div>
    );
};

export default UploadFile;
