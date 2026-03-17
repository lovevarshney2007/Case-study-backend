import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Document } from "../models/documentModel.js"; // Aapka naya Document model

// 1. Helper function to call ML Server (Harsh's Domain)
const callLegalMlServer = async (endpoint, file) => {
    // Harsh ke server ka base URL (e.g., http://localhost:8500 ya ngrok IP)
    const ML_SERVER_URL = process.env.ML_SERVER_URL || `http://localhost:8000${endpoint}`;

    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype
    });

    try {
        const response = await axios.post(ML_SERVER_URL, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 120000, // 2 Minutes timeout (AI models take time)
        });
        return response.data;
    } catch (error) {
        const errorMsg = error.code === 'ECONNREFUSED' 
            ? "ML Server is offline or unreachable. Is Harsh's server running?" 
            : (error.response?.data?.detail || error.message);

        throw new ApiError(error.response?.status || 500, `ML Pipeline Error: ${errorMsg}`);
    }
}

// 2. Main Processing Controller
const processLegalDocumentController = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Legal document (PDF or Image) is required");
    }

    let documentRecord;

    try {
        // Step A: Database mein initial entry banao
        documentRecord = await Document.create({
            userId: req.user._id,
            originalFileName: req.file.originalname,
            status: 'processing'
        });

        console.log(`[INFO] Sending ${req.file.originalname} to ML Server for OCR & AI Summary...`);

        // Step B: Harsh ke ML server ko hit karo (Endpoint use '/simplify' bananeko bolna)
        const mlResult = await callLegalMlServer("/simplify", req.file);

        // Step C: ML Server se aayi details Database mein update karo
        documentRecord.status = 'completed';
        documentRecord.extractedText = mlResult.extracted_text || "Text extraction pending";
        documentRecord.simplifiedSummary = mlResult.simplified_summary || "Summary generation pending";
        documentRecord.entities = mlResult.entities || {}; 
        
        await documentRecord.save();

        // Step D: Clean up local file 
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        // Step E: Send success response to Siddharth (Frontend)
        return res.status(200).json(
            new ApiResponse(200, documentRecord, "Document successfully processed and simplified!")
        );

    } catch (error) {
        // Agar fail hua, toh database ka status 'failed' kar do
        if (documentRecord) {
            documentRecord.status = 'failed';
            await documentRecord.save();
        }
        
        // Clean up memory
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        console.error("Document Processing Error:", error);
        throw error;
    }
});

// 3. User ki Dashboard History ke liye Controller (Frontend par purane cases dikhane ke liye)
const getUserDocumentsController = asyncHandler(async (req, res) => {
    const documents = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    return res.status(200).json(
        new ApiResponse(200, documents, "User document history fetched successfully")
    );
});

export {
    processLegalDocumentController,
    getUserDocumentsController
};