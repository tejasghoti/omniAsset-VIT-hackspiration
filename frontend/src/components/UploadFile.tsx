import { useState } from 'react';

const UploadFile = ({ onUploadSuccess }: { onUploadSuccess: (cid: string, metadata: any) => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('description', 'Uploaded via OmniAsset');

        try {
            const response = await fetch('http://localhost:3001/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const checkJson = await response.json();
            // The backend returns { cid, metadata, ipfsGatewayUrl }
            onUploadSuccess(checkJson.cid, checkJson.metadata);
            setUploading(false);
            setFile(null); // Clear file after success
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Upload failed');
            setUploading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-xl max-w-md mx-auto mt-10">
            <h3 className="text-xl font-bold text-white mb-4">Upload Dataset / Model</h3>

            <div className="flex flex-col gap-4">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-600 file:text-white
            hover:file:bg-blue-700
            cursor-pointer"
                />

                {file && (
                    <div className="text-sm text-gray-300">
                        Selected: <span className="font-mono text-blue-400">{file.name}</span>
                    </div>
                )}

                {error && (
                    <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
                        Error: {error}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className={`w-full py-2 px-4 rounded-lg font-bold transition-all ${!file || uploading
                            ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/20'
                        }`}
                >
                    {uploading ? 'Uploading to IPFS...' : 'Upload & Pin'}
                </button>
            </div>
        </div>
    );
};

export default UploadFile;
