import axiosClient from "../../../shared/lib/axiosClient.js";

export const adminApi = {
  async listUsers() {
    const { data } = await axiosClient.get("/admin/users");
    return data.data;
  },
  async inviteUser(payload) {
    const { data } = await axiosClient.post("/admin/users/invite", payload);
    return data.data;
  },
  async updateUserRole(userId, role) {
    const { data } = await axiosClient.patch(`/admin/users/${userId}/role`, { role });
    return data.data;
  },
  async getScoringDefaults() {
    const { data } = await axiosClient.get("/admin/organization/scoring-defaults");
    return data.data;
  },
  async updateScoringDefaults(payload) {
    const { data } = await axiosClient.patch("/admin/organization/scoring-defaults", payload);
    return data.data;
  },
  async auditLogs(params = {}) {
    const { data } = await axiosClient.get("/admin/audit-logs", { params });
    return data.data;
  },
};
