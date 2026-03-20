import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Document } from "../models/documentModel.js";
import NodeCache from "node-cache";

const docCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const RAG_BASE_URL = process.env.MULTI_RAG_SERVICE_URL || "http://localhost:8001"; // Aapke swagger UI wala URL

export const processLegalDocumentController = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Legal document (PDF/Image) is required");

    let documentRecord;

    try {
        // 1. Database mein 'processing' status ke sath entry
        documentRecord = await Document.create({ 
            userId: req.user._id, 
            originalFileName: req.file.originalname, 
            status: 'processing' 
        });

        // 2. File ko ML/RAG server bhejne ke liye taiyaar karo
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        console.log(`[INFO] Sending ${req.file.originalname} to RAG Server...`);

        // 3. RAG Server ko Hit karo (/uploader/post_content)
        const response = await axios.post(`${RAG_BASE_URL}/uploader/post_content`, formData, {
            headers: { 
                ...formData.getHeaders(),
                "user_id": String(req.user._id) // RAG ko user_id chahiye thi
            },
            timeout: 120000 
        });

        // 4. Sab theek raha toh DB update karo
        documentRecord.status = 'completed';
        documentRecord.extractedText = response.data?.text || "Uploaded to RAG knowledge base";
        await documentRecord.save();

        // 5. VS Code se Temp file delete kar do
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        // 6. Cache clear karo taaki dashboard history update ho jaye
        docCache.del(`history_${req.user._id}`);

        return res.status(200).json(
            new ApiResponse(200, documentRecord, "Document successfully uploaded and processed by RAG!")
        );

    } catch (error) {
        // Agar kuch fail hua toh status 'failed' mark karo
        if (documentRecord) {
            documentRecord.status = 'failed';
            await documentRecord.save();
        }
        
        // Temp file clean karo
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        const errMessage = error.response?.data || error.message;
        console.error("Document Processing Error:", errMessage);
        throw new ApiError(500, `Failed to process document: ${JSON.stringify(errMessage)}`);
    }
});

// History endpoint waisa hi rahega...
export const getUserDocumentsController = asyncHandler(async (req, res) => {
    const cacheKey = `history_${req.user._id}`;
    const cachedData = docCache.get(cacheKey);

    if (cachedData) return res.status(200).json(new ApiResponse(200, cachedData, "User document history fetched (Cached)"));

    const documents = await Document.find({ userId: req.user._id }).lean().sort({ createdAt: -1 });
    
    docCache.set(cacheKey, documents); 
    return res.status(200).json(new ApiResponse(200, documents, "User document history fetched successfully"));
});