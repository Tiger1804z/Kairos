import { Router } from "express";
import {
  uploadDocument,
  listDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocumentById,
  processDocument,
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

// Delete
router.delete("/:id", deleteDocumentById);


router.post("/:id/process", processDocument);



export default router;
