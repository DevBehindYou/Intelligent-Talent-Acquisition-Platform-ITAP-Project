import adminAxiosClient from "../../../shared/lib/adminAxiosClient.js";
import { supabase } from "../../../shared/lib/supabaseClient.js";

export const adminAuthApi = {
  async login({ email, password }) {
    let result;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      result = data;
    } catch (err) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("invalid login") || msg.includes("email not confirmed")) {
        throw new Error("Invalid email or password.");
      }
      throw err;
    }
    // The backend rejects (403) any email not on the SUPER_ADMIN_EMAILS allowlist.
    const { data: session } = await adminAxiosClient.post("/admin-panel/auth/session", {
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
    // MFA-enabled admins get no session yet — carry the tokens to the code step.
    if (session.data.mfaRequired) {
      return {
        mfaRequired: true,
        accessToken: result.session.access_token,
        refreshToken: result.session.refresh_token,
      };
    }
    return { admin: session.data.admin };
  },

  async mfaLogin({ accessToken, refreshToken, code }) {
    const { data } = await adminAxiosClient.post("/admin-panel/auth/mfa/login", {
      access_token: accessToken,
      refresh_token: refreshToken,
      code,
    });
    return data.data.admin;
  },

  async logout() {
    await adminAxiosClient.post("/admin-panel/auth/logout");
    await supabase.auth.signOut();
  },

  async me() {
    const { data } = await adminAxiosClient.get("/admin-panel/auth/me");
    return data.data;
  },

  async mfaSetup() {
    const { data } = await adminAxiosClient.post("/admin-panel/auth/mfa/setup");
    return data.data; // { otpauthUrl, secret, qrDataUrl }
  },
  async mfaEnable(code) {
    const { data } = await adminAxiosClient.post("/admin-panel/auth/mfa/enable", { code });
    return data.data;
  },
  async mfaDisable(code) {
    const { data } = await adminAxiosClient.post("/admin-panel/auth/mfa/disable", { code });
    return data.data;
  },
};

export const adminDashboardApi = {
  async get() {
    const { data } = await adminAxiosClient.get("/admin-panel/dashboard");
    return data.data;
  },
};

const get = (path, params) => adminAxiosClient.get(`/admin-panel${path}`, { params }).then((r) => r.data.data);
const post = (path) => adminAxiosClient.post(`/admin-panel${path}`).then((r) => r.data.data);

export const adminManagementApi = {
  candidates: {
    list: (params) => get("/candidates", params),
    get: (id) => get(`/candidates/${id}`),
    suspend: (id) => post(`/candidates/${id}/suspend`),
    reactivate: (id) => post(`/candidates/${id}/reactivate`),
    anonymize: (id) => post(`/candidates/${id}/anonymize`),
  },
  organizations: { list: (params) => get("/organizations", params) },
  recruiters: {
    list: (params) => get("/recruiters", params),
    activate: (id) => post(`/recruiters/${id}/activate`),
    deactivate: (id) => post(`/recruiters/${id}/deactivate`),
  },
  applications: { list: (params) => get("/applications", params) },
  auditLogs: { list: (params) => get("/audit-logs", params) },
};
