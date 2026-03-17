import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// 1. Predict Case (JSON Body)
// 1. Predict Case (Fixed with Case Type Number Mapping)
export const predictCase = asyncHandler(async (req, res) => {
    const { case_type, lawyer_exp, judge_exp, judge_count } = req.body;

    // 🚀 Translator: Frontend ki string ko ML ke number mein convert karein
    const caseTypeMapping = {
        "Criminal": 0,
        "Civil": 1,
        "Family": 2,
        "Corporate": 3,
        "Tax": 4,
        "Constitutional": 5,
        "Labor": 6,
        "Property": 7
    };

    // Agar mapping mein value mili toh wo number use karo, warna default 0 bhej do
    const mapped_case_type = caseTypeMapping[case_type] !== undefined ? caseTypeMapping[case_type] : 0;

    const response = await fetch(`${ML_BASE_URL}/api/v1/predict`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": req.headers.authorization || "" 
        },
        body: JSON.stringify({ 
            case_type: mapped_case_type, // Yahan ML ko ab number jayega!
            lawyer_exp: Number(lawyer_exp), // Ise bhi strictly number bana diya
            judge_exp: Number(judge_exp),
            judge_count: Number(judge_count)
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ PYTHON ML ERROR:", errorText);
        throw new ApiError(response.status, `Prediction failed on ML Server: ${errorText}`);
    }

    const data = await response.json();
    return res.status(200).json(new ApiResponse(200, data, "Prediction successful"));
});


// 2. Ask Vakil Sahab (POST request but Python expects Query Params)
export const askVakilSahab = asyncHandler(async (req, res) => {
    const { user_query, docs_path = "data", db_path = "db", k = 5 } = req.body;
    if (!user_query) throw new ApiError(400, "user_query is required");

    const mlUrl = new URL(`${ML_BASE_URL}/api/v1/chat/ask_vakil_sahab`);
    mlUrl.searchParams.append("user_query", user_query);
    mlUrl.searchParams.append("docs_path", docs_path);
    mlUrl.searchParams.append("db_path", db_path);
    mlUrl.searchParams.append("k", k.toString());

    const response = await fetch(mlUrl, { method: "POST" });
    if (!response.ok) throw new ApiError(500, "Vakil Sahab chat failed");
    const data = await response.json();

    return res.status(200).json(new ApiResponse(200, data, "Chat response fetched"));
});

// 3. Chat MCP Agent (POST request with Query Params)
export const chatMcpAgent = asyncHandler(async (req, res) => {
    const { query } = req.body;
    if (!query) throw new ApiError(400, "query is required");

    const mlUrl = new URL(`${ML_BASE_URL}/api/v1/chat_mcp_agent/chat_agent`);
    mlUrl.searchParams.append("query", query);

    const response = await fetch(mlUrl, { method: "POST" });
    if (!response.ok) throw new ApiError(500, "MCP Agent chat failed");
    const data = await response.json();

    return res.status(200).json(new ApiResponse(200, data, "Agent response fetched"));
});

// 4. Legal Web Search (GET request with Query Params)
export const legalWebSearch = asyncHandler(async (req, res) => {
    const { query, max_results = 5 } = req.query; // GET requests use req.query
    if (!query) throw new ApiError(400, "query is required");

    const mlUrl = new URL(`${ML_BASE_URL}/api/v1/search/legal_web_search`);
    mlUrl.searchParams.append("query", query);
    mlUrl.searchParams.append("max_results", max_results.toString());

    const response = await fetch(mlUrl);
    if (!response.ok) throw new ApiError(500, "Legal search failed");
    const data = await response.json();

    return res.status(200).json(new ApiResponse(200, data, "Search results fetched"));
});

// 5. Ingest Legal Data (GET request with Query Params)
export const ingestLegalData = asyncHandler(async (req, res) => {
    const { source = "kaggle" } = req.query;

    const mlUrl = new URL(`${ML_BASE_URL}/api/v1/ingest/ingest_legal_data`);
    mlUrl.searchParams.append("source", source);

    const response = await fetch(mlUrl);
    if (!response.ok) throw new ApiError(500, "Data ingestion failed");
    const data = await response.json();

    return res.status(200).json(new ApiResponse(200, data, "Data ingested successfully"));
});

// 6. Health Check (GET request)
export const checkHealth = asyncHandler(async (req, res) => {
    const response = await fetch(`${ML_BASE_URL}/health`);
    if (!response.ok) throw new ApiError(500, "ML Service is down");
    const data = await response.json();

    return res.status(200).json(new ApiResponse(200, data, "ML Service is healthy"));
});