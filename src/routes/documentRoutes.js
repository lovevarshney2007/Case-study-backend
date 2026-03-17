import { Router } from "express";
import { uploadDocument } from "../middlewares/multerMiddleware.js";
import { processLegalDocumentController, getUserDocumentsController } from "../controllers/documentController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = Router();


router.route("/process").post(verifyJWT, uploadDocument.single("document"), processLegalDocumentController);

// Ye API dashboard par hit hogi
router.route("/history").get(verifyJWT, getUserDocumentsController);

export default router;