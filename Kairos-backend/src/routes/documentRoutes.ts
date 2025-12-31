import { Router } from "express";
import {
  uploadDocument,
  listDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocumentById,
  processDocument,
} from "../controllers/documentController";
import { requireAuth } from "../middleware/authMiddleware";
import { requireBusinessAccess } from "../middleware/requireBusinessAccess";

const router = Router();



// Upload (multipart/form-data)
router.post(
  "/:business_id/upload",
  requireBusinessAccess({ from: "params", key: "business_id" }),
  uploadDocument
);

// List (query params)
router.get("/",requireBusinessAccess({from:"query" , key: "business_id", entity: "business" }) , listDocuments);

// Detail
router.get(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "document" }),
  getDocumentById
);

// Download
router.get(
  "/:id/download",
  requireBusinessAccess({ from: "params", key: "id", entity: "document" }),
  downloadDocument
);

// Delete
router.delete(
  "/:id",
  requireBusinessAccess({ from: "params", key: "id", entity: "document" }),
  deleteDocumentById
);

router.post(
  "/:id/process",
  requireBusinessAccess({ from: "params", key: "id", entity: "document" }),
  processDocument
);


export default router;
