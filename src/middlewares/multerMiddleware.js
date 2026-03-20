import multer from 'multer';
import path from "path";
import fs from "fs";
import { ApiError } from '../utils/ApiError.js';

// 🚀 FIX: Auto-create temp directory if it doesn't exist to prevent ENOENT errors
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// 1. Update File Filter for BOTH PDF and Images
const multiFormatFileFilter = (req, file, cb) => { 
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true); 
    }
    
    return cb(new ApiError(400, 'Only PDF documents and Images (JPG/PNG) are allowed!'), false);
};

// 2. Local Storage (ML Server par bhejne ke liye temporary save)
const localDiskStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, tempDir); // Auto-created folder use hoga
    },
    filename: function(req, file, cb){
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Extension dynamically nikal lega (.pdf, .jpg, etc.)
        cb(null, 'legal-doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 3. Export Middleware
const uploadDocument = multer({
    storage: localDiskStorage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit taaki heavy PDFs/Images handle ho sakein
    fileFilter: multiFormatFileFilter
});

export { uploadDocument };