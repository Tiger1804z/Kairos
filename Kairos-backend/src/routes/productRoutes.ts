import { Router } from "express";
import { handleGetProducts } from "../controllers/productController";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";
import { validateBusinessIdParam } from "../middleware/validateBusinessIdParam";

const router = Router();

router.get("/:businessId", validateBusinessIdParam, requireBusinessAccess({ from: "params", key: "businessId" }), handleGetProducts);

export default router;
