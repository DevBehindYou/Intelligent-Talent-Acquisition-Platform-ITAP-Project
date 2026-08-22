import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { ProtectedRoute, RoleRoute } from "./layout/ProtectedRoute.jsx";
import AppShell from "./layout/AppShell.jsx";
import CandidateProtectedRoute from "../features/candidate-portal/layout/CandidateProtectedRoute.jsx";
import CandidatePortalShell from "../features/candidate-portal/layout/CandidatePortalShell.jsx";
import AdminProtectedRoute from "../features/admin-panel/layout/AdminProtectedRoute.jsx";
import AdminPanelShell from "../features/admin-panel/layout/AdminPanelShell.jsx";
import PageLoadingFallback from "../shared/components/PageLoadingFallback.jsx";
import NotFoundPage from "../shared/components/NotFoundPage.jsx";

// Every page is route-split via React.lazy — the initial production build produced a
// single 1.1MB JS bundle with no splitting (caught by `npm run build`'s own chunk-size
// warning); this is the fix. Each top-level route now ships its own chunk, so logging in
// only downloads the Dashboard's code, not Admin/Analytics/Talent Search/etc. as well.
const LoginPage = lazy(() => import("../features/auth/pages/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../features/auth/pages/RegisterPage.jsx"));
const ForgotPasswordPage = lazy(() => import("../features/auth/pages/ForgotPasswordPage.jsx"));

const DashboardPage = lazy(() => import("../features/analytics/pages/DashboardPage.jsx"));
const AnalyticsDashboardPage = lazy(() => import("../features/analytics/pages/AnalyticsDashboardPage.jsx"));

const JobListPage = lazy(() => import("../features/jobs/pages/JobListPage.jsx"));
const CreateJobPage = lazy(() => import("../features/jobs/pages/CreateJobPage.jsx"));
const JobDetailPage = lazy(() => import("../features/jobs/pages/JobDetailPage.jsx"));

const ResumeUploadPage = lazy(() => import("../features/resumes/pages/ResumeUploadPage.jsx"));

const CandidateListPage = lazy(() => import("../features/candidates/pages/CandidateListPage.jsx"));
const CandidateDetailPage = lazy(() => import("../features/candidates/pages/CandidateDetailPage.jsx"));

const PipelineOverviewPage = lazy(() => import("../features/pipeline/pages/PipelineOverviewPage.jsx"));

const ScoringWeightsPage = lazy(() => import("../features/matching/pages/ScoringWeightsPage.jsx"));

const ScheduleInterviewPage = lazy(() => import("../features/interviews/pages/ScheduleInterviewPage.jsx"));
const InterviewFeedbackPage = lazy(() => import("../features/interviews/pages/InterviewFeedbackPage.jsx"));

const TalentSearchPage = lazy(() => import("../features/talent-search/pages/TalentSearchPage.jsx"));
const TalentPoolsPage = lazy(() => import("../features/talent-search/pages/TalentPoolsPage.jsx"));

const MessagingPage = lazy(() => import("../features/messaging/pages/MessagingPage.jsx"));

const ShortlistsPage = lazy(() => import("../features/candidates/pages/ShortlistsPage.jsx"));
const ComparisonPage = lazy(() => import("../features/candidates/pages/ComparisonPage.jsx"));

const NotificationsPage = lazy(() => import("../features/analytics/pages/NotificationsPage.jsx"));
const ProfileSettingsPage = lazy(() => import("../features/auth/pages/ProfileSettingsPage.jsx"));

const AdminUsersPage = lazy(() => import("../features/admin/pages/AdminUsersPage.jsx"));
const AdminScoringDefaultsPage = lazy(() => import("../features/admin/pages/AdminScoringDefaultsPage.jsx"));
const AdminAuditLogPage = lazy(() => import("../features/admin/pages/AdminAuditLogPage.jsx"));
const AdminCompliancePage = lazy(() => import("../features/admin/pages/AdminCompliancePage.jsx"));

// Candidate portal (separate surface — docs/13). Each page is its own chunk.
const CandidateLoginPage = lazy(() => import("../features/candidate-portal/pages/CandidateLoginPage.jsx"));
const CandidateRegisterPage = lazy(() => import("../features/candidate-portal/pages/CandidateRegisterPage.jsx"));
const CandidateDashboardPage = lazy(() => import("../features/candidate-portal/pages/CandidateDashboardPage.jsx"));
const CandidateJobsPage = lazy(() => import("../features/candidate-portal/pages/CandidateJobsPage.jsx"));
const CandidateJobDetailPage = lazy(() => import("../features/candidate-portal/pages/CandidateJobDetailPage.jsx"));
const CandidateApplicationsPage = lazy(() => import("../features/candidate-portal/pages/CandidateApplicationsPage.jsx"));
const CandidateApplicationDetailPage = lazy(() =>
  import("../features/candidate-portal/pages/CandidateApplicationDetailPage.jsx")
);
const CandidateProfilePage = lazy(() => import("../features/candidate-portal/pages/CandidateProfilePage.jsx"));
const CandidateResumesPage = lazy(() => import("../features/candidate-portal/pages/CandidateResumesPage.jsx"));
const CandidateInterviewsPage = lazy(() => import("../features/candidate-portal/pages/CandidateInterviewsPage.jsx"));
const CandidateMessagesPage = lazy(() => import("../features/candidate-portal/pages/CandidateMessagesPage.jsx"));
const CandidateOffersPage = lazy(() => import("../features/candidate-portal/pages/CandidateOffersPage.jsx"));
const CandidateAssessmentsPage = lazy(() => import("../features/candidate-portal/pages/CandidateAssessmentsPage.jsx"));
const CandidateOnboardingPage = lazy(() => import("../features/candidate-portal/pages/CandidateOnboardingPage.jsx"));

// Super-admin panel (separate surface, allowlist-gated).
const AdminLoginPage = lazy(() => import("../features/admin-panel/pages/AdminLoginPage.jsx"));
const AdminDashboardPage = lazy(() => import("../features/admin-panel/pages/AdminDashboardPage.jsx"));
const AdminCandidatesPage = lazy(() => import("../features/admin-panel/pages/AdminCandidatesPage.jsx"));
const AdminCandidateDetailPage = lazy(() => import("../features/admin-panel/pages/AdminCandidateDetailPage.jsx"));
const AdminRecruitersPage = lazy(() => import("../features/admin-panel/pages/AdminRecruitersPage.jsx"));
const AdminOrganizationsPage = lazy(() => import("../features/admin-panel/pages/AdminOrganizationsPage.jsx"));
const AdminApplicationsPage = lazy(() => import("../features/admin-panel/pages/AdminApplicationsPage.jsx"));
const PlatformAuditLogPage = lazy(() => import("../features/admin-panel/pages/AdminAuditLogPage.jsx"));
const AdminSecurityPage = lazy(() => import("../features/admin-panel/pages/AdminSecurityPage.jsx"));

function withSuspense(element) {
  return <Suspense fallback={<PageLoadingFallback />}>{element}</Suspense>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={withSuspense(<LoginPage />)} />
      <Route path="/register" element={withSuspense(<RegisterPage />)} />
      <Route path="/forgot-password" element={withSuspense(<ForgotPasswordPage />)} />

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={withSuspense(<DashboardPage />)} />

          <Route path="/jobs" element={withSuspense(<JobListPage />)} />
          <Route path="/jobs/new" element={withSuspense(<CreateJobPage />)} />
          <Route path="/jobs/:jobId/edit" element={withSuspense(<CreateJobPage />)} />
          <Route path="/jobs/:jobId" element={withSuspense(<JobDetailPage />)} />
          <Route path="/jobs/:jobId/upload" element={withSuspense(<ResumeUploadPage />)} />
          <Route path="/jobs/:jobId/scoring" element={withSuspense(<ScoringWeightsPage />)} />

          <Route path="/candidates" element={withSuspense(<CandidateListPage />)} />
          <Route path="/candidates/:candidateId" element={withSuspense(<CandidateDetailPage />)} />
          <Route path="/candidates/:candidateId/schedule" element={withSuspense(<ScheduleInterviewPage />)} />
          <Route path="/candidates/:candidateId/message" element={withSuspense(<MessagingPage />)} />

          <Route path="/pipeline" element={withSuspense(<PipelineOverviewPage />)} />

          <Route path="/talent-search" element={withSuspense(<TalentSearchPage />)} />
          <Route path="/talent-pools" element={withSuspense(<TalentPoolsPage />)} />

          <Route path="/shortlists" element={withSuspense(<ShortlistsPage />)} />
          <Route path="/shortlists/compare" element={withSuspense(<ComparisonPage />)} />

          <Route path="/interviews/:interviewId/feedback" element={withSuspense(<InterviewFeedbackPage />)} />

          <Route path="/analytics" element={withSuspense(<AnalyticsDashboardPage />)} />
          <Route path="/notifications" element={withSuspense(<NotificationsPage />)} />
          <Route path="/settings/profile" element={withSuspense(<ProfileSettingsPage />)} />

          <Route element={<RoleRoute roles={["hr_admin"]} />}>
            <Route path="/admin/users" element={withSuspense(<AdminUsersPage />)} />
            <Route path="/admin/scoring-defaults" element={withSuspense(<AdminScoringDefaultsPage />)} />
            <Route path="/admin/audit-log" element={withSuspense(<AdminAuditLogPage />)} />
            <Route path="/admin/compliance" element={withSuspense(<AdminCompliancePage />)} />
          </Route>
        </Route>
      </Route>

      {/* Candidate portal — a fully separate surface from the staff app above (docs/13 §21). */}
      <Route path="/candidate/login" element={withSuspense(<CandidateLoginPage />)} />
      <Route path="/candidate/register" element={withSuspense(<CandidateRegisterPage />)} />
      <Route element={<CandidateProtectedRoute />}>
        <Route element={<CandidatePortalShell />}>
          <Route path="/candidate" element={<Navigate to="/candidate/dashboard" replace />} />
          <Route path="/candidate/dashboard" element={withSuspense(<CandidateDashboardPage />)} />
          <Route path="/candidate/jobs" element={withSuspense(<CandidateJobsPage />)} />
          <Route path="/candidate/jobs/:jobId" element={withSuspense(<CandidateJobDetailPage />)} />
          <Route path="/candidate/applications" element={withSuspense(<CandidateApplicationsPage />)} />
          <Route path="/candidate/applications/:applicationId" element={withSuspense(<CandidateApplicationDetailPage />)} />
          <Route path="/candidate/interviews" element={withSuspense(<CandidateInterviewsPage />)} />
          <Route path="/candidate/messages" element={withSuspense(<CandidateMessagesPage />)} />
          <Route path="/candidate/offers" element={withSuspense(<CandidateOffersPage />)} />
          <Route path="/candidate/assessments" element={withSuspense(<CandidateAssessmentsPage />)} />
          <Route path="/candidate/onboarding" element={withSuspense(<CandidateOnboardingPage />)} />
          <Route path="/candidate/profile" element={withSuspense(<CandidateProfilePage />)} />
          <Route path="/candidate/resumes" element={withSuspense(<CandidateResumesPage />)} />
        </Route>
      </Route>

      {/* Super-admin panel — a separate, restricted surface (docs/13 §6). Never linked from
          the candidate or staff apps. */}
      <Route path="/admin-panel/login" element={withSuspense(<AdminLoginPage />)} />
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminPanelShell />}>
          <Route path="/admin-panel" element={withSuspense(<AdminDashboardPage />)} />
          <Route path="/admin-panel/candidates" element={withSuspense(<AdminCandidatesPage />)} />
          <Route path="/admin-panel/candidates/:id" element={withSuspense(<AdminCandidateDetailPage />)} />
          <Route path="/admin-panel/recruiters" element={withSuspense(<AdminRecruitersPage />)} />
          <Route path="/admin-panel/organizations" element={withSuspense(<AdminOrganizationsPage />)} />
          <Route path="/admin-panel/applications" element={withSuspense(<AdminApplicationsPage />)} />
          <Route path="/admin-panel/audit" element={withSuspense(<PlatformAuditLogPage />)} />
          <Route path="/admin-panel/security" element={withSuspense(<AdminSecurityPage />)} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
