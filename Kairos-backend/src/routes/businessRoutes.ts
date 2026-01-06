import { Router } from "express";
import { createMyBusiness, deleteMyBusinessById, getMyBusinessById, listMyBusinesses, updateMyBusinessById } from "../controllers/businessController";
import { requireAuth } from "../middleware/authMiddleware";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();

router.post("/", requireAuth, createMyBusiness);
router.get("/", requireAuth, listMyBusinesses);

router.get("/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "business" }),
  getMyBusinessById
);

router.patch("/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "business" }),
  updateMyBusinessById
);

router.delete("/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "business" }),
  deleteMyBusinessById
);

export default router;
