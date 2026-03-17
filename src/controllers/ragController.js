import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

const RAG_BASE_URL = process.env.MULTI_RAG_SERVICE_URL || "http://localhost:8001";

// 1. Basic Chat Model Check
export const checkChatModel = asyncHandler(async (req, res) => {
    const response = await fetch(`${RAG_BASE_URL}/chat`);
    if (!response.ok) {
        throw new ApiError(500, "Failed to connect to Chat Model");
    }
    return res.status(200).json(
        new ApiResponse(200, { status: "Active" }, "Chat model is reachable and running")
    );
});

// 2. Chat with RAG (🚀 FIXED: Added user_id in headers)
export const chatWithRag = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) throw new ApiError(400, "Message is required");

    const mlUrl = new URL(`${RAG_BASE_URL}/chat/chat`);
    mlUrl.searchParams.append("message", message);

    const response = await fetch(mlUrl, { 
        method: "POST",
        headers: {
            "Authorization": req.headers.authorization || "", 
            "Content-Type": "application/json",
            // 🚀 PYTHON KO USER ID BHEJ RAHE HAIN YAHAN SE:
            "user_id": String(req.user._id)
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new ApiError(response.status, `Chat failed: ${errText}`);
    }
    
    const data = await response.json();
    return res.status(200).json(new ApiResponse(200, data, "Chat response successful"));
});


// 3. Web Summarizer (🚀 FIXED: Added user_id in headers)
export const summarizeWeb = asyncHandler(async (req, res) => {
    const { url } = req.body;
    if (!url) throw new ApiError(400, "URL is required");

    const mlUrl = new URL(`${RAG_BASE_URL}/web/web_summerizer`);
    mlUrl.searchParams.append("url", url);

    const response = await fetch(mlUrl, { 
        method: "POST",
        headers: {
            "Authorization": req.headers.authorization || "",
            "Content-Type": "application/json",
            // 🚀 PYTHON KO USER ID BHEJ RAHE HAIN:
            "user_id": String(req.user._id)
        }
    });

    if (!response.ok) {
         const errText = await response.text();
         throw new ApiError(response.status, `Web summarization failed: ${errText}`);
    }
    
    const data = await response.json();
    return res.status(200).json(new ApiResponse(200, data, "Website summarized successfully"));
});

// 4. List all Blogs (🚀 FIXED: Added user_id in headers)
export const listBlogs = asyncHandler(async (req, res) => {
    const response = await fetch(`${RAG_BASE_URL}/blog/blogs`, {
        headers: { "user_id": String(req.user._id) }
    });
    if (!response.ok) throw new ApiError(500, "Failed to fetch blogs");
    const data = await response.json();

    return res.status(200).json(new ApiResponse(200, data, "Blogs fetched successfully"));
});

// 5. Get Specific Blog by Title 
export const getBlog = asyncHandler(async (req, res) => {
    const { title } = req.params;
    const response = await fetch(`${RAG_BASE_URL}/blog/blog/${title}`, {
        headers: { "user_id": String(req.user._id) }
    });
    
    if (!response.ok) throw new ApiError(404, "Blog not found");
    const data = await response.json();

    return res.status(200).json(new ApiResponse(200, data, "Blog fetched successfully"));
});

// 6. Delete Blog 
export const deleteBlog = asyncHandler(async (req, res) => {
    const response = await fetch(`${RAG_BASE_URL}/blog/delete_blog`, {
        method: "DELETE",
        headers: { 
            "Content-Type": "application/json",
            "user_id": String(req.user._id)
        },
        body: JSON.stringify(req.body) 
    });

    if (!response.ok) throw new ApiError(500, "Failed to delete blog");
    const data = await response.json();

    return res.status(200).json(new ApiResponse(200, data, "Blog deleted successfully"));
});

// 7. Upload Content (🚀 FIXED: Using Axios & passing user_id)
export const uploadContent = asyncHandler(async (req, res) => {
    const file = req.file; 
    if (!file) throw new ApiError(400, "File is required");

    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path), {
            filename: file.originalname,
            contentType: file.mimetype
        });

        // FastAPI RAG Server upload URL
        const UPLOAD_URL = `${RAG_BASE_URL}/uploader/post_content`;

        const response = await axios.post(UPLOAD_URL, formData, {
            headers: { 
                ...formData.getHeaders(),
                "user_id": String(req.user._id) // User ID jaruri hai RAG ke liye
            },
            timeout: 60000 
        });

        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

        return res.status(200).json(new ApiResponse(200, response.data, "Content uploaded successfully to Multi-Rag"));
        
    } catch (error) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        
        const errMessage = error.response?.data || error.message;
        console.error("RAG Upload Error:", errMessage);
        throw new ApiError(500, `Failed to upload document to RAG server: ${JSON.stringify(errMessage)}`);
    }
});