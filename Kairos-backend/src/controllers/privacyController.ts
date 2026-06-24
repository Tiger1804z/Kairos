import type { Request, Response } from "express";
import { PrivacyEventType } from "../../generated/prisma/client";
import { recordConsent } from "../services/privacyConsentService";

/*
 * PROCÉDURE MANUELLE (beta) :
 *
 * Ces routes enregistrent uniquement une demande en tant qu'événement d'audit
 * dans privacy_consent_events. Aucun export ni suppression n'est déclenché
 * automatiquement. Un admin doit traiter chaque demande manuellement :
 *   - data-export-request → produire et envoyer l'export au marchand
 *   - deletion-request   → supprimer les données métier après vérification légale
 *
 * La suppression réelle n'est pas automatisée en beta.
 * L'event log (privacy_consent_events) sert de preuve / audit trail.
 */

export const requestDataExport = async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });

    const userId = req.user?.user_id ?? null;

    await recordConsent(
      businessId,
      userId,
      PrivacyEventType.data_export_requested,
      { source: "api", metadata: { status: "pending" } }
    );

    return res.status(202).json({
      message: "Data export request recorded. An admin will process it manually.",
    });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const requestDataDeletion = async (req: Request, res: Response) => {
  try {
    const businessId = req.businessId;
    if (!businessId) return res.status(400).json({ error: "BUSINESS_ID_REQUIRED" });

    const userId = req.user?.user_id ?? null;

    await recordConsent(
      businessId,
      userId,
      PrivacyEventType.data_deletion_requested,
      { source: "api", metadata: { status: "pending" } }
    );

    return res.status(202).json({
      message: "Data deletion request recorded. An admin will process it manually. No data has been deleted.",
    });
  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};
