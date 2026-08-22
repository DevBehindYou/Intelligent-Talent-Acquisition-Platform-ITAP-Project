import candidateAxiosClient from "../../../shared/lib/candidateAxiosClient.js";
import { supabase } from "../../../shared/lib/supabaseClient.js";
import { disconnectSocket } from "../../../shared/lib/socketClient.js";

// Model layer for the candidate portal. Auth mirrors the staff flow (Supabase sign-in →
// hand the access token to Express → Express sets its own httpOnly candidate session cookie),
// but every call targets the /candidate/* endpoints via the candidate axios client.

export const candidateAuthApi = {
  async login({ email, password }) {
    let result;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      result = data;
    } catch (err) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("invalid login") || msg.includes("email not confirmed")) {
        throw new Error("Invalid email or password. Please check your credentials and try again.");
      }
      throw err;
    }
    const { data: session } = await candidateAxiosClient.post("/candidate/auth/session", {
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
    return session.data.candidate;
  },

  async signup({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        throw new Error("An account with this email already exists. Try signing in instead.");
      }
      throw error;
    }
    // Email confirmation on: no session until the user clicks the link.
    if (!data.session?.access_token) return { requiresEmailConfirmation: true };

    const { data: result } = await candidateAxiosClient.post("/candidate/auth/signup", {
      access_token: data.session.access_token,
      fullName,
    });
    return { candidate: result.data.candidate };
  },

  async logout() {
    await candidateAxiosClient.post("/candidate/auth/logout");
    disconnectSocket(); // drop the authenticated realtime connection
    await supabase.auth.signOut();
  },

  async me() {
    const { data } = await candidateAxiosClient.get("/candidate/auth/me");
    return data.data;
  },

  async forgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
};

export const candidateProfileApi = {
  async get() {
    const { data } = await candidateAxiosClient.get("/candidate/profile");
    return data.data;
  },
  async update(payload) {
    const { data } = await candidateAxiosClient.patch("/candidate/profile", payload);
    return data.data;
  },
};

export const candidateResumeApi = {
  async list() {
    const { data } = await candidateAxiosClient.get("/candidate/resumes");
    return data.data.items;
  },
  async upload(file, kind = "resume") {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    const { data } = await candidateAxiosClient.post("/candidate/resumes", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
  async setPrimary(documentId) {
    const { data } = await candidateAxiosClient.patch(`/candidate/resumes/${documentId}/primary`);
    return data.data;
  },
  async downloadUrl(documentId) {
    const { data } = await candidateAxiosClient.get(`/candidate/resumes/${documentId}/download`);
    return data.data.url;
  },
  async remove(documentId) {
    await candidateAxiosClient.delete(`/candidate/resumes/${documentId}`);
  },
};

export const candidateJobsApi = {
  async list(params = {}) {
    const { data } = await candidateAxiosClient.get("/candidate/jobs", { params });
    return data.data;
  },
  async get(jobId) {
    const { data } = await candidateAxiosClient.get(`/candidate/jobs/${jobId}`);
    return data.data;
  },
};

export const candidateOffersApi = {
  async list() {
    const { data } = await candidateAxiosClient.get("/candidate/offers");
    return data.data.items;
  },
  async get(offerId) {
    const { data } = await candidateAxiosClient.get(`/candidate/offers/${offerId}`);
    return data.data;
  },
  async accept(offerId) {
    const { data } = await candidateAxiosClient.post(`/candidate/offers/${offerId}/accept`);
    return data.data;
  },
  async decline(offerId) {
    const { data } = await candidateAxiosClient.post(`/candidate/offers/${offerId}/decline`);
    return data.data;
  },
  async documentUrl(offerId, index) {
    const { data } = await candidateAxiosClient.get(`/candidate/offers/${offerId}/documents/${index}/download`);
    return data.data.url;
  },
};

export const candidateOnboardingApi = {
  async list() {
    const { data } = await candidateAxiosClient.get("/candidate/onboarding");
    return data.data.items;
  },
  async submitTask(taskId, payload) {
    const { data } = await candidateAxiosClient.post(`/candidate/onboarding/tasks/${taskId}/submit`, payload);
    return data.data;
  },
  async acknowledgeTask(taskId) {
    const { data } = await candidateAxiosClient.post(`/candidate/onboarding/tasks/${taskId}/acknowledge`);
    return data.data;
  },
};

export const candidateAssessmentsApi = {
  async list() {
    const { data } = await candidateAxiosClient.get("/candidate/assessments");
    return data.data.items;
  },
  async get(assignmentId) {
    const { data } = await candidateAxiosClient.get(`/candidate/assessments/${assignmentId}`);
    return data.data;
  },
  async submit(assignmentId, submissionText) {
    const { data } = await candidateAxiosClient.post(`/candidate/assessments/${assignmentId}/submit`, { submissionText });
    return data.data;
  },
};

export const candidateInterviewsApi = {
  async list() {
    const { data } = await candidateAxiosClient.get("/candidate/interviews");
    return data.data.items;
  },
  async get(interviewId) {
    const { data } = await candidateAxiosClient.get(`/candidate/interviews/${interviewId}`);
    return data.data;
  },
};

export const candidateConversationsApi = {
  async list() {
    const { data } = await candidateAxiosClient.get("/candidate/conversations");
    return data.data.items;
  },
  async thread(conversationId) {
    const { data } = await candidateAxiosClient.get(`/candidate/conversations/${conversationId}`);
    return data.data; // { conversation, messages }
  },
  async send(conversationId, body) {
    const { data } = await candidateAxiosClient.post(`/candidate/conversations/${conversationId}/messages`, { body });
    return data.data;
  },
  async start({ applicationId, subject, body }) {
    const { data } = await candidateAxiosClient.post("/candidate/conversations", { applicationId, subject, body });
    return data.data;
  },
};

export const candidateNotificationsApi = {
  async list() {
    const { data } = await candidateAxiosClient.get("/candidate/notifications");
    return data.data; // { items, unreadCount }
  },
  async markRead(notificationId) {
    const { data } = await candidateAxiosClient.patch(`/candidate/notifications/${notificationId}/read`);
    return data.data;
  },
  async markAllRead() {
    await candidateAxiosClient.post("/candidate/notifications/read-all");
  },
};

export const candidateApplicationsApi = {
  async list() {
    const { data } = await candidateAxiosClient.get("/candidate/applications");
    return data.data.items;
  },
  async get(applicationId) {
    const { data } = await candidateAxiosClient.get(`/candidate/applications/${applicationId}`);
    return data.data;
  },
  async apply(payload) {
    const { data } = await candidateAxiosClient.post("/candidate/applications", payload);
    return data.data;
  },
  async withdraw(applicationId) {
    const { data } = await candidateAxiosClient.post(`/candidate/applications/${applicationId}/withdraw`);
    return data.data;
  },
};
