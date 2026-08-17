// RBAC gate — docs/04-auth-security.md §4. Tenant isolation itself is enforced separately,
// in the service layer, by always scoping queries with req.session.organizationId.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !allowedRoles.includes(req.session.role)) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not permitted." } });
    }
    next();
  };
}
