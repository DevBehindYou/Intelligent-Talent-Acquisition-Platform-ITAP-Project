import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCandidateAuthViewModel } from "../hooks/useCandidateAuthViewModel.js";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";

// Candidate-side gate. A staff/super_admin cookie can't satisfy this because the backend's
// requireCandidate rejects it, so /candidate/auth/me 401s → we redirect to the candidate login.
export default function CandidateProtectedRoute() {
  const { isAuthenticated, isLoading } = useCandidateAuthViewModel();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="p-lg">
        <SkeletonCard />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/candidate/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
