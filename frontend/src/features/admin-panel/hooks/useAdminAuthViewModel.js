import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { adminAuthApi } from "../services/adminPanelApi.js";
import { useAdminAuthStore } from "../store/adminAuthStore.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useAdminAuthViewModel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { admin, status, setAdmin, clear } = useAdminAuthStore();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const { data: meData, error: meError, status: queryStatus } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: adminAuthApi.me,
    retry: false,
    enabled: status === "idle",
    throwOnError: false,
  });

  useEffect(() => {
    if (status !== "idle") return;
    if (queryStatus === "success" && meData) setAdmin(meData);
    else if (queryStatus === "error" || meError) clear();
  }, [status, queryStatus, meData, meError, setAdmin, clear]);

  const [mfaPending, setMfaPending] = useState(null); // { accessToken, refreshToken }

  const loginMutation = useMutation({
    mutationFn: adminAuthApi.login,
    onSuccess: (data) => {
      if (data.mfaRequired) {
        setMfaPending({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        return; // wait for the TOTP code before completing sign-in
      }
      setAdmin(data.admin);
      navigate("/admin-panel");
    },
    onError: (err) => {
      const code = err?.response?.data?.error?.code;
      const message =
        code === "NOT_AUTHORIZED"
          ? "This account is not permitted to access the admin panel."
          : err?.message || err?.response?.data?.error?.message || "Sign in failed.";
      pushToast({ tone: "danger", message });
    },
  });

  const mfaLoginMutation = useMutation({
    mutationFn: (code) => adminAuthApi.mfaLogin({ ...mfaPending, code }),
    onSuccess: (admin) => {
      setAdmin(admin);
      setMfaPending(null);
      navigate("/admin-panel");
    },
    onError: (err) =>
      pushToast({ tone: "danger", message: err?.response?.data?.error?.message || "Invalid authentication code." }),
  });

  const logoutMutation = useMutation({
    mutationFn: adminAuthApi.logout,
    onSuccess: () => {
      clear();
      queryClient.clear();
      navigate("/admin-panel/login");
    },
  });

  return {
    admin,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "idle",
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    mfaPending: Boolean(mfaPending),
    submitMfa: mfaLoginMutation.mutate,
    isVerifyingMfa: mfaLoginMutation.isPending,
    logout: logoutMutation.mutate,
  };
}
