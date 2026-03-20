import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import NodeCache from "node-cache";

const mlCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// 🚀 CACHED API
export const predictCase = asyncHandler(async (req, res) => {
    const { case_type, lawyer_exp, judge_exp, judge_count, complexity, evidence } = req.body;

    const cacheKey = `predict_${case_type}_${lawyer_exp}_${judge_exp}_${judge_count}_${complexity}_${evidence}`;
    const cachedData = mlCache.get(cacheKey);
    if (cachedData) return res.status(200).json(new ApiResponse(200, cachedData, "Prediction successful (Cached)"));

    const caseTypeMapping = { "Criminal": 0, "Civil": 1, "Family": 2, "Corporate": 3, "Tax": 4, "Constitutional": 5, "Labor": 6, "Property": 7 };
    const mapped_case_type = caseTypeMapping[case_type] !== undefined ? caseTypeMapping[case_type] : 0;

    const response = await fetch(`${ML_BASE_URL}/api/v1/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": req.headers.authorization || "" },
        body: JSON.stringify({ 
            case_type: mapped_case_type, lawyer_exp: Number(lawyer_exp), judge_exp: Number(judge_exp), 
            judge_count: Number(judge_count), complexity: Number(complexity), evidence: Number(evidence)
        })
    });

    if (!response.ok) throw new ApiError(response.status, `Prediction failed on ML Server`);
    const data = await response.json();
    
    mlCache.set(cacheKey, data);
    return res.status(200).json(new ApiResponse(200, data, "Prediction successful"));
});

// 🚀 CACHED API
export const askVakilSahab = asyncHandler(async (req, res) => {
    const { user_query, docs_path = "data", db_path = "db", k = 5 } = req.body;
    if (!user_query) throw new ApiError(400, "user_query is required");

    const cacheKey = `vakil_${user_query}_${k}`;
    const cachedData = mlCache.get(cacheKey);
    if (cachedData) return res.status(200).json(new ApiResponse(200, cachedData, "Chat response fetched (Cached)"));

    const mlUrl = new URL(`${ML_BASE_URL}/api/v1/chat/ask_vakil_sahab`);
    mlUrl.searchParams.append("user_query", user_query);
    mlUrl.searchParams.append("docs_path", docs_path);
    mlUrl.searchParams.append("db_path", db_path);
    mlUrl.searchParams.append("k", k.toString());

    const response = await fetch(mlUrl, { method: "POST" });
    if (!response.ok) throw new ApiError(500, "Vakil Sahab chat failed");
    const data = await response.json();

    mlCache.set(cacheKey, data);
    return res.status(200).json(new ApiResponse(200, data, "Chat response fetched"));
});

export const chatMcpAgent = asyncHandler(async (req, res) => {
    // Agent Chat - No Cache (Requires dynamic thinking)
    const { query } = req.body;
    if (!query) throw new ApiError(400, "query is required");

    const mlUrl = new URL(`${ML_BASE_URL}/api/v1/chat_mcp_agent/chat_agent`);
    mlUrl.searchParams.append("query", query);

    const response = await fetch(mlUrl, { method: "POST" });
    if (!response.ok) throw new ApiError(500, "MCP Agent chat failed");
    const data = await response.json();

    return res.status(200).json(new ApiResponse(200, data, "Agent response fetched"));
});

// 🚀 CACHED API
export const legalWebSearch = asyncHandler(async (req, res) => {
    const { query, max_results = 5 } = req.query; 
    if (!query) throw new ApiError(400, "query is required");

    const cacheKey = `search_${query}_${max_results}`;
    const cachedData = mlCache.get(cacheKey);
    if (cachedData) return res.status(200).json(new ApiResponse(200, cachedData, "Search results fetched (Cached)"));

    const mlUrl = new URL(`${ML_BASE_URL}/api/v1/search/legal_web_search`);
    mlUrl.searchParams.append("query", query);
    mlUrl.searchParams.append("max_results", max_results.toString());

    const response = await fetch(mlUrl);
    if (!response.ok) throw new ApiError(500, "Legal search failed");
    const data = await response.json();

    mlCache.set(cacheKey, data);
    return res.status(200).json(new ApiResponse(200, data, "Search results fetched"));
});

export const ingestLegalData = asyncHandler(async (req, res) => {
    // Action Trigger - No cache
    const { source = "kaggle" } = req.query;
    const mlUrl = new URL(`${ML_BASE_URL}/api/v1/ingest/ingest_legal_data`);
    mlUrl.searchParams.append("source", source);

    const response = await fetch(mlUrl);
    if (!response.ok) throw new ApiError(500, "Data ingestion failed");
    const data = await response.json();
    return res.status(200).json(new ApiResponse(200, data, "Data ingested successfully"));
});

export const checkHealth = asyncHandler(async (req, res) => {
    const response = await fetch(`${ML_BASE_URL}/health`);
    if (!response.ok) throw new ApiError(500, "ML Service is down");
    const data = await response.json();
    return res.status(200).json(new ApiResponse(200, data, "ML Service is healthy"));
});