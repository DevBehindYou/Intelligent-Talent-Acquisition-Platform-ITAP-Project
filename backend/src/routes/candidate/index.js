import { Router } from "express";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import resumeRoutes from "./resumes.routes.js";
import jobRoutes from "./jobs.routes.js";
import applicationRoutes from "./applications.routes.js";
import interviewRoutes from "./interviews.routes.js";
import notificationRoutes from "./notifications.routes.js";
import conversationRoutes from "./conversations.routes.js";
import offerRoutes from "./offers.routes.js";
import assessmentRoutes from "./assessments.routes.js";
import onboardingRoutes from "./onboarding.routes.js";

// The candidate portal API, mounted at /api/candidate. Every sub-router except /auth is gated
// by requireCandidate, so a staff/super_admin token cannot reach candidate resources and a
// candidate token cannot reach any staff route (docs/13 §1.2, §7).
const router = Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/resumes", resumeRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/interviews", interviewRoutes);
router.use("/notifications", notificationRoutes);
router.use("/conversations", conversationRoutes);
router.use("/offers", offerRoutes);
router.use("/assessments", assessmentRoutes);
router.use("/onboarding", onboardingRoutes);

export default router;
