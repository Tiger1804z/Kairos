import { Router } from "express";
import {
  uploadMyDocument,
  listMyDocuments,
  listMyDocumentById,
  downloadMyDocumentById,
  deleteMyDocumentById,
  processMyDocument
} from "../controllers/documentController";
import { requireAuth } from "../middleware/authMiddleware";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();



// Upload (multipart/form-data)
router.post(
  "/:business_id/upload",
  requireBusinessAccess({ from: "params", key: "business_id" }),
  uploadMyDocument
);

// List (query params)
router.get("/",requireBusinessAccess({from:"query" , key: "business_id", entity: "business" }) , listMyDocuments);
// Detail
router.get(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "document" }),
  listMyDocumentById
);

// Download
router.get(
  "/:id/download",
  requireBusinessAccess({ from: "params", key: "id", entity: "document" }),
  downloadMyDocumentById
);

// Delete
router.delete(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "document" }),
  deleteMyDocumentById
);

router.post(
  "/:id/process",
  requireBusinessAccess({ from: "params", key: "id", entity: "document" }),
  processMyDocument
);


export default router;
