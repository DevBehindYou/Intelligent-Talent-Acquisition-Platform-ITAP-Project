import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminManagementApi } from "../services/adminPanelApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

function useToast() {
  const pushToast = useNotificationsStore((s) => s.pushToast);
  return {
    ok: (message) => pushToast({ tone: "success", message }),
    err: (e) => pushToast({ tone: "danger", message: e?.response?.data?.error?.message || "Action failed." }),
  };
}

export function useAdminCandidates(params) {
  const qc = useQueryClient();
  const toast = useToast();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "candidates"] });
  const { data, isLoading } = useQuery({ queryKey: ["admin", "candidates", params], queryFn: () => adminManagementApi.candidates.list(params) });

  const suspend = useMutation({ mutationFn: adminManagementApi.candidates.suspend, onSuccess: () => { invalidate(); toast.ok("Candidate suspended."); }, onError: toast.err });
  const reactivate = useMutation({ mutationFn: adminManagementApi.candidates.reactivate, onSuccess: () => { invalidate(); toast.ok("Candidate reactivated."); }, onError: toast.err });
  const anonymize = useMutation({ mutationFn: adminManagementApi.candidates.anonymize, onSuccess: () => { invalidate(); toast.ok("Candidate anonymized."); }, onError: toast.err });

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    suspend: suspend.mutate,
    reactivate: reactivate.mutate,
    anonymize: anonymize.mutate,
  };
}

export function useAdminCandidateDetail(id) {
  const qc = useQueryClient();
  const toast = useToast();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "candidate", id] });
    qc.invalidateQueries({ queryKey: ["admin", "candidates"] });
  };
  const { data, isLoading } = useQuery({ queryKey: ["admin", "candidate", id], queryFn: () => adminManagementApi.candidates.get(id), enabled: Boolean(id) });

  const suspend = useMutation({ mutationFn: () => adminManagementApi.candidates.suspend(id), onSuccess: () => { invalidate(); toast.ok("Candidate suspended."); }, onError: toast.err });
  const reactivate = useMutation({ mutationFn: () => adminManagementApi.candidates.reactivate(id), onSuccess: () => { invalidate(); toast.ok("Candidate reactivated."); }, onError: toast.err });
  const anonymize = useMutation({ mutationFn: () => adminManagementApi.candidates.anonymize(id), onSuccess: () => { invalidate(); toast.ok("Candidate anonymized."); }, onError: toast.err });

  return { candidate: data, isLoading, suspend: suspend.mutate, reactivate: reactivate.mutate, anonymize: anonymize.mutate };
}

export function useAdminRecruiters(params) {
  const qc = useQueryClient();
  const toast = useToast();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "recruiters"] });
  const { data, isLoading } = useQuery({ queryKey: ["admin", "recruiters", params], queryFn: () => adminManagementApi.recruiters.list(params) });
  const activate = useMutation({ mutationFn: adminManagementApi.recruiters.activate, onSuccess: () => { invalidate(); toast.ok("Recruiter activated."); }, onError: toast.err });
  const deactivate = useMutation({ mutationFn: adminManagementApi.recruiters.deactivate, onSuccess: () => { invalidate(); toast.ok("Recruiter deactivated."); }, onError: toast.err });
  return { items: data?.items ?? [], total: data?.total ?? 0, isLoading, activate: activate.mutate, deactivate: deactivate.mutate };
}

export function useAdminOrganizations(params) {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "organizations", params], queryFn: () => adminManagementApi.organizations.list(params) });
  return { items: data?.items ?? [], total: data?.total ?? 0, isLoading };
}

export function useAdminApplications(params) {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "applications", params], queryFn: () => adminManagementApi.applications.list(params) });
  return { items: data?.items ?? [], total: data?.total ?? 0, isLoading };
}

export function useAdminAuditLogs(params) {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "audit-logs", params], queryFn: () => adminManagementApi.auditLogs.list(params) });
  return { items: data?.items ?? [], total: data?.total ?? 0, isLoading };
}
