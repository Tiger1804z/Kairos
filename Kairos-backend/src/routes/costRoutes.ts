import { Router } from "express";
import { handleCreateCost, handleGetCosts, handleImportCsv, csvUpload } from "../controllers/costController";

const router = Router();

router.post("/", handleCreateCost);
router.post("/import-csv", csvUpload, handleImportCsv);
router.get("/:productId", handleGetCosts);

export default router;
