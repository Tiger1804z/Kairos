import { Router } from "express";
import {
  uploadDocument,
  listDocuments,
  getDocumentById,
  downloadDocument,
} from "../controllers/documentController";

const router = Router();

// Upload (multipart/form-data)
router.post("/:business_id/upload", uploadDocument);


// List (query params)
router.get("/", listDocuments);

// Detail
router.get("/:id", getDocumentById);

// Download
router.get("/:id/download", downloadDocument);

export default router;
