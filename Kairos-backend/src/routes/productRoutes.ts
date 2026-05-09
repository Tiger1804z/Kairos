import { Router } from "express";
import { handleGetProducts } from "../controllers/productController";

const router = Router();

router.get("/:businessId", handleGetProducts);

export default router;
