import express from "express";
import { 
    predictCase, 
    askVakilSahab, 
    chatMcpAgent, 
    legalWebSearch, 
    ingestLegalData, 
    checkHealth 
} from "../utils/caseController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

// Public route to check if ML microservice is running
router.get("/health", checkHealth);

// POST Routes (Apply verifyJWT if you want these to be protected/logged-in only)
router.post("/predict", verifyJWT, predictCase);
router.post("/ask-vakil", verifyJWT, askVakilSahab);
router.post("/chat-agent", verifyJWT, chatMcpAgent);

// GET Routes (Information retrieval)
router.get("/search", verifyJWT, legalWebSearch);
router.get("/ingest", verifyJWT, ingestLegalData);

export default router;