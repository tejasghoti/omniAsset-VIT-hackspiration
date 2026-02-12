const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for temp storage
const upload = multer({ dest: 'uploads/' });

// Initialize Pinata
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

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
        // 1. AI Fingerprinting & Quality Check (Mock)
        // In a real app, this would hash the file and check a DB for duplicates.
        const qualityScore = Math.floor(Math.random() * (100 - 80) + 80); // Random score between 80-100
        const isDuplicate = false; // Mock duplicate check

        if (isDuplicate) {
            fs.unlinkSync(filePath);
            return res.status(409).json({ error: 'Duplicate file detected' });
        }

        // 2. Upload File to IPFS
        const readableStreamForFile = fs.createReadStream(filePath);
        const options = {
            pinataMetadata: {
                name: `OmniAsset_${fileName}`,
                keyvalues: {
                    qualityScore: qualityScore.toString(),
                    aiValidated: "true"
                }
            },
        };

        const fileResult = await pinata.pinFileToIPFS(readableStreamForFile, options);
        const fileCid = fileResult.IpfsHash;

        // 3. Create ARC-69 Metadata
        const metadata = {
            standard: "arc69",
            description: description || "No description provided",
            external_url: `ipfs://${fileCid}`,
            mime_type: req.file.mimetype,
            properties: {
                file_name: fileName,
                file_size: req.file.size,
                quality_score: qualityScore,
                ai_validated: true,
                ...properties
            }
        };

        // 3. Upload Metadata to IPFS (Optional but good for full decentralization, 
        //    though ARC-69 usually puts metadata in the Asset Config Note. 
        //    However, for large metadata or "ARC-3" style fallback, pinning JSON is good.)
        //    For this "Steel Thread", we will return the CID and the Metadata JSON 
        //    so the Frontend can put it into the Note field (ARC-69 style).

        // Clean up temp file
        fs.unlinkSync(filePath);

        // Return CID and Metadata for the frontend to mint
        res.json({
            cid: fileCid,
            metadata: metadata,
            ipfsGatewayUrl: `https://gateway.pinata.cloud/ipfs/${fileCid}`
        });

    } catch (error) {
        console.error('Upload Error:', error);
        // Clean up temp file if exists
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: 'Failed to upload to IPFS', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
