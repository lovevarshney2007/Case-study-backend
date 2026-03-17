import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { uploadDocument } from "../middlewares/multerMiddleware.js";
import { 
    checkChatModel, 
    chatWithRag, 
    summarizeWeb, 
    listBlogs, 
    getBlog, 
    deleteBlog, 
    uploadContent 
} from "../controllers/ragController.js";

const router = express.Router();

// Chat & Summarizer endpoints
router.get("/chat-status", verifyJWT, checkChatModel);
router.post("/chat", verifyJWT, chatWithRag);
router.post("/summarize-web", verifyJWT, summarizeWeb);

// Blog endpoints
router.get("/blogs", verifyJWT, listBlogs);
router.get("/blogs/:title", verifyJWT, getBlog);
router.delete("/blogs/delete", verifyJWT, deleteBlog);

// Upload endpoint (Uses Multer to process the file before sending to Python)
router.post("/upload", verifyJWT, uploadDocument.single("file"), uploadContent);

export default router;