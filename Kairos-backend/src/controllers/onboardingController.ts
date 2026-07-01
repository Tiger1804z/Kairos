import type {Request, Response} from "express";
import prisma from "../prisma/prisma";
import { createBusinessForOwnerService } from "../services/businessService";
import { recordConsent, PrivacyEventType } from "../services/privacyConsentService";

/**
 * POST /onboarding/business
 * Cree un business pour le user pendant l'onboarding (step 1 du wizard)
 * Body: name (obligatoire), currency (obligatoire), business_type (optionnel), timezone (optionnel),
 *       consent_accepted (obligatoire, doit etre true) — l'acceptation de la politique de
 *       confidentialite est requise (Loi 25) : creation business + event consentement sont atomiques.
 */
export const createOnboardingBusiness = async (req: Request, res: Response) => {
    try{
        // le user vient du middleware requireAuth (dans req.user)
        const user = (req as any).user.user_id;
        const {name, currency, business_type, timezone, consent_accepted} = req.body;

        // validation: name et currency obligatoires
        if (!name || !currency) {
            return res.status(400).json({ error: "MISSING_FIELDS", message: "name et currency sont obligatoires." });
        }

        // consentement obligatoire: pas de business sans acceptation de la politique de confidentialite
        if (consent_accepted !== true) {
            return res.status(400).json({ error: "CONSENT_REQUIRED", message: "L'acceptation de la politique de confidentialite est obligatoire." });
        }

        // transaction: business + event consentement crees ensemble, ou rien (rollback complet)
        const business = await prisma.$transaction(async (tx) => {
            const created = await createBusinessForOwnerService({
                owner_id: user,
                name,
                currency,
                business_type: business_type ?? null,
                timezone: timezone ??  "America/Montreal",
            }, tx);

            try {
                await recordConsent(created.id_business, user, PrivacyEventType.privacy_policy_accepted, { tx });
            } catch (consentErr) {
                console.error("[privacy] recordConsent failed:", consentErr instanceof Error ? consentErr.message : "unknown");
                // throw generique: fait echouer la transaction sans propager de detail Prisma au client
                throw new Error("CONSENT_RECORDING_FAILED");
            }

            return created;
        });

        return res.status(201).json(business);
    } catch (error: any) {
        const msg = error?.message ?? "INTERNAL_SERVER_ERROR";

        if (msg === "BUSINESS_NAME_ALREADY_EXISTS") {
            return res.status(400).json({ error: msg});
        }
        if (msg === "CONSENT_RECORDING_FAILED") {
            return res.status(500).json({ error: msg, message: "Le consentement n'a pas pu etre enregistre. Aucun business n'a ete cree." });
        }
        return res.status(500).json({ error:"INTERNAL_SERVER_ERROR" });


    }
};
