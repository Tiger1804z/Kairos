import { Router } from "express";
import { createOnboardingBusiness } from "../controllers/onboardingController";

const router = Router();

// POST /onboarding/business — creer un business pendant l'onboarding
router.post("/business", createOnboardingBusiness);

export default router;
