import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import { ProtectedRoute, RoleRoute } from "./layout/ProtectedRoute.jsx";
import AppShell from "./layout/AppShell.jsx";
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

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
