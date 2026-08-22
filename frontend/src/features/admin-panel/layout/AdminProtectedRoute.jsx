import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuthViewModel } from "../hooks/useAdminAuthViewModel.js";

export default function AdminProtectedRoute() {
  const { isAuthenticated, isLoading } = useAdminAuthViewModel();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <span className="text-white/50 text-body-md">Loading…</span>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/admin-panel/login" replace />;
  return <Outlet />;
}
