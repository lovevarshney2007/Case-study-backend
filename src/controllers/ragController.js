import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import NodeCache from "node-cache";

// Cache setup: 1 hour (3600 seconds) for standard stuff, 5 mins for dynamic lists
const myCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const RAG_BASE_URL = process.env.MULTI_RAG_SERVICE_URL || "http://localhost:8001";

export const checkChatModel = asyncHandler(async (req, res) => {
    // Health check - No cache needed
    const response = await fetch(`${RAG_BASE_URL}/chat`);
    if (!response.ok) throw new ApiError(500, "Failed to connect to Chat Model");
    return res.status(200).json(new ApiResponse(200, { status: "Active" }, "Chat model is reachable and running"));
});

export const chatWithRag = asyncHandler(async (req, res) => {
    // Chat Model - No cache needed (Chat should be dynamic)
    const { message } = req.body;
    if (!message) throw new ApiError(400, "Message is required");

    const mlUrl = new URL(`${RAG_BASE_URL}/chat/chat`);
    mlUrl.searchParams.append("message", message);

    const response = await fetch(mlUrl, { 
        method: "POST",
        headers: { "Authorization": req.headers.authorization || "", "Content-Type": "application/json", "user_id": String(req.user._id) }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new ApiError(response.status, `Chat failed: ${errText}`);
    }
    const data = await response.json();
    return res.status(200).json(new ApiResponse(200, data, "Chat response successful"));
});

// 🚀 CACHED API
export const summarizeWeb = asyncHandler(async (req, res) => {
    const { url } = req.body;
    if (!url) throw new ApiError(400, "URL is required");

    const cacheKey = `summary_${url}`;
    const cachedData = myCache.get(cacheKey);
    if (cachedData) return res.status(200).json(new ApiResponse(200, cachedData, "Website summarized successfully (Cached)"));

    const mlUrl = new URL(`${RAG_BASE_URL}/web/web_summerizer`);
    mlUrl.searchParams.append("url", url);

    const response = await fetch(mlUrl, { 
        method: "POST",
        headers: { "Authorization": req.headers.authorization || "", "Content-Type": "application/json", "user_id": String(req.user._id) }
    });

    if (!response.ok) throw new ApiError(response.status, `Web summarization failed: ${await response.text()}`);
    const data = await response.json();
    myCache.set(cacheKey, data); // Set Cache
    return res.status(200).json(new ApiResponse(200, data, "Website summarized successfully"));
});

// 🚀 CACHED API
export const listBlogs = asyncHandler(async (req, res) => {
    const cacheKey = `blogs_list_${req.user._id}`;
    const cachedData = myCache.get(cacheKey);
    if (cachedData) return res.status(200).json(new ApiResponse(200, cachedData, "Blogs fetched successfully (Cached)"));

    const response = await fetch(`${RAG_BASE_URL}/blog/blogs`, { headers: { "user_id": String(req.user._id) } });
    if (!response.ok) throw new ApiError(500, "Failed to fetch blogs");
    const data = await response.json();
    
    myCache.set(cacheKey, data, 300); // 5 minutes cache only (taaki naye blog jaldi dikh jayein)
    return res.status(200).json(new ApiResponse(200, data, "Blogs fetched successfully"));
});

// 🚀 CACHED API
export const getBlog = asyncHandler(async (req, res) => {
    const { title } = req.params;
    const cacheKey = `blog_detail_${req.user._id}_${title}`;
    const cachedData = myCache.get(cacheKey);
    if (cachedData) return res.status(200).json(new ApiResponse(200, cachedData, "Blog fetched successfully (Cached)"));

    const response = await fetch(`${RAG_BASE_URL}/blog/blog/${title}`, { headers: { "user_id": String(req.user._id) } });
    if (!response.ok) throw new ApiError(404, "Blog not found");
    const data = await response.json();

    myCache.set(cacheKey, data);
    return res.status(200).json(new ApiResponse(200, data, "Blog fetched successfully"));
});

export const deleteBlog = asyncHandler(async (req, res) => {
    // Action API - No Cache
    const response = await fetch(`${RAG_BASE_URL}/blog/delete_blog`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "user_id": String(req.user._id) },
        body: JSON.stringify(req.body) 
    });
    if (!response.ok) throw new ApiError(500, "Failed to delete blog");
    
    // NAYA: Cache invalidate kar do taaki list update ho jaye
    myCache.del(`blogs_list_${req.user._id}`);
    
    const data = await response.json();
    return res.status(200).json(new ApiResponse(200, data, "Blog deleted successfully"));
});

export const uploadContent = asyncHandler(async (req, res) => {
    // Upload API - No Cache
    const file = req.file; 
    if (!file) throw new ApiError(400, "File is required");

    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path), { filename: file.originalname, contentType: file.mimetype });

        const UPLOAD_URL = `${RAG_BASE_URL}/uploader/post_content`;
        const response = await axios.post(UPLOAD_URL, formData, {
            headers: { ...formData.getHeaders(), "user_id": String(req.user._id) },
            timeout: 60000 
        });

        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(200).json(new ApiResponse(200, response.data, "Content uploaded successfully to Multi-Rag"));
    } catch (error) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new ApiError(500, `Failed to upload document to RAG server.`);
    }
});