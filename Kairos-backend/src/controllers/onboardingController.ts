import type {Request, Response} from "express";
import { createBusinessForOwnerService } from "../services/businessService";
import { recordConsent, PrivacyEventType } from "../services/privacyConsentService";

/**
 * POST /onboarding/business
 * Cree un business pour le user pendant l'onboarding (step 1 du wizard)
 * Body: name (obligatoire), currency (obligatoire), business_type (optionnel), timezone (optionnel),
 *       consent_accepted (boolean) — si true, enregistre l'acceptation de la politique de confidentialite
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

        // on utilise le service de creation de business (qui a deja la logique de validation, unicité, etc.)
        const business = await createBusinessForOwnerService({
            owner_id: user,
            name,
            currency,
            business_type: business_type ?? null,
            timezone: timezone ??  "America/Montreal",
        });

        if (consent_accepted === true) {
            try {
                await recordConsent(business.id_business, user, PrivacyEventType.privacy_policy_accepted);
            } catch (consentErr) {
                console.error("[privacy] recordConsent failed:", consentErr instanceof Error ? consentErr.message : "unknown");
            }
        }

        return res.status(201).json(business);
    } catch (error: any) {
        const msg = error?.message ?? "INTERNAL_SERVER_ERROR";

        if (msg === "BUSINESS_NAME_ALREADY_EXISTS") {
            return res.status(400).json({ error: msg});
        }
        return res.status(500).json({ error:"INTERNAL_SERVER_ERROR" });


    }
};
