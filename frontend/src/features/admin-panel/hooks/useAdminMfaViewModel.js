import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminAuthApi } from "../services/adminPanelApi.js";
import { useAdminAuthStore } from "../store/adminAuthStore.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useAdminMfaViewModel() {
  const { admin, setAdmin } = useAdminAuthStore();
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const [setup, setSetup] = useState(null); // { otpauthUrl, secret, qrDataUrl }
  const fail = (e) => pushToast({ tone: "danger", message: e?.response?.data?.error?.message || "Action failed." });

  const startSetupMutation = useMutation({ mutationFn: adminAuthApi.mfaSetup, onSuccess: setSetup, onError: fail });

  const enableMutation = useMutation({
    mutationFn: adminAuthApi.mfaEnable,
    onSuccess: () => {
      setSetup(null);
      if (admin) setAdmin({ ...admin, mfaEnabled: true });
      pushToast({ tone: "success", message: "Two-factor authentication enabled." });
    },
    onError: fail,
  });

  const disableMutation = useMutation({
    mutationFn: adminAuthApi.mfaDisable,
    onSuccess: () => {
      if (admin) setAdmin({ ...admin, mfaEnabled: false });
      pushToast({ tone: "info", message: "Two-factor authentication disabled." });
    },
    onError: fail,
  });

  return {
    mfaEnabled: Boolean(admin?.mfaEnabled),
    setup,
    startSetup: startSetupMutation.mutate,
    isStarting: startSetupMutation.isPending,
    enable: enableMutation.mutate,
    isEnabling: enableMutation.isPending,
    disable: disableMutation.mutate,
    isDisabling: disableMutation.isPending,
  };
}
