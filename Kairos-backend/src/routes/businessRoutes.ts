import { Router } from "express";
import { createBusiness, deleteBusiness, getBusinessById, getBusinesses, updateBusiness,  } from "../controllers/businessController";

const router = Router();

// POST /businesses
router.post("/", createBusiness);
// GET /businesses
router.get("/", getBusinesses);
router.get("/:id", getBusinessById);
router.patch("/:id", updateBusiness);
// DELETE /businesses/:id
router.delete("/:id", deleteBusiness);

export default router;