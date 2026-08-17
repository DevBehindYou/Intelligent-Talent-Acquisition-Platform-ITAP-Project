import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useAdminUsersViewModel() {
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  const { data, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: adminApi.listUsers });

  const inviteMutation = useMutation({
    mutationFn: adminApi.inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      pushToast({ tone: "success", message: "Invite sent." });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => adminApi.updateUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return {
    users: data ?? [],
    isLoading,
    invite: inviteMutation.mutate,
    isInviting: inviteMutation.isPending,
    updateRole: roleMutation.mutate,
  };
}
