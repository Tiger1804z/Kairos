import { Router } from "express";
import { handleGetProducts } from "../controllers/productController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.get("/:businessId", requireBusinessAccess({ from: "params", key: "businessId" }), handleGetProducts);

export default router;
