import { Router } from "express";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import managementRoutes from "./management.routes.js";

// The Super-Admin panel API, mounted at /api/admin-panel. Distinct from the org-scoped staff
// admin routes at /api/admin (requireRole "hr_admin"). Every route except /auth is gated by
// requireSuperAdmin, so staff and candidate tokens are rejected (docs/13 §6, §17).
const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/", managementRoutes); // /candidates, /organizations, /recruiters, /applications, /audit-logs

export default router;
