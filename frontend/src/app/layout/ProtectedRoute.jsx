import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthViewModel } from "../../features/auth/hooks/useAuthViewModel.js";
import { SkeletonCard } from "../../shared/components/Skeleton.jsx";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthViewModel();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="p-lg">
        <SkeletonCard />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

// Gate for role-restricted pages (e.g. /admin/*) — used alongside ProtectedRoute in routes.jsx.
export function RoleRoute({ roles }) {
  const { user } = useAuthViewModel();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
