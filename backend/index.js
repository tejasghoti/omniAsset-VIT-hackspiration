const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load .env from root

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for temp storage
const upload = multer({ dest: 'uploads/' });

// Initialize Pinata
let pinata;
if (process.env.PINATA_JWT) {
    pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });
} else {
    pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);
}

// Test Pinata connection
pinata.testAuthentication().then((result) => {
    console.log('Pinata connected:', result);
}).catch((err) => {
    console.error('Pinata connection failed:', err);
});

// Routes
app.get('/', (req, res) => {
    res.send('OmniAsset Backend Running');
});

// Upload Endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const { name, description, ...properties } = req.body;

    try {
        console.log(`Processing upload: ${fileName}`);

        // 1. Upload File to IPFS
        const readableStreamForFile = fs.createReadStream(filePath);
        const options = {
            pinataMetadata: {
                name: `OmniAsset_${fileName}`,
                keyvalues: {
                    aiValidated: "true"
                }
            },
        };

        const fileResult = await pinata.pinFileToIPFS(readableStreamForFile, options);
        const fileCid = fileResult.IpfsHash;

        // 2. Create Metadata (ARC-3 / ARC-69 compatible JSON)
        const metadata = {
            name: name || fileName,
            description: description || "No description provided",
            image: `ipfs://${fileCid}`,
            external_url: `ipfs://${fileCid}`,
            properties: {
                file_name: fileName,
                file_size: req.file.size,
                ai_validated: true,
                ...properties
            }
        };

        // 3. Pin Metadata to IPFS
        // This gives us a single CID for the asset URL
        const metadataResult = await pinata.pinJSONToIPFS(metadata, {
            pinataMetadata: {
                name: `OmniAsset_Metadata_${fileName}`
            }
        });
        const metadataCid = metadataResult.IpfsHash;

        // Clean up temp file
        fs.unlinkSync(filePath);

        console.log(`Uploaded. File CID: ${fileCid}, Metadata CID: ${metadataCid}`);

        // Return CIDs
        res.json({
            fileCid: fileCid,
            metadataCid: metadataCid,
            metadata: metadata,
            assetUrl: `ipfs://${metadataCid}`,
            ipfsGatewayUrl: `https://gateway.pinata.cloud/ipfs/${metadataCid}`
        });

    } catch (error) {
        console.error('Upload Error:', error);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: 'Failed to upload to IPFS', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
