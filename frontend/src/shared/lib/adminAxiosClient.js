import axios from "axios";

// Separate axios instance for the super-admin panel — its own refresh endpoint and its own
// session-expired handling (→ /admin-panel/login), fully isolated from the staff and candidate
// clients (docs/13 §6).
const adminAxiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

let isRefreshing = false;
let pendingQueue = [];

function resolvePendingQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
}

adminAxiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/")) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => adminAxiosClient(originalRequest));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await adminAxiosClient.post("/admin-panel/auth/refresh");
        resolvePendingQueue(null);
        return adminAxiosClient(originalRequest);
      } catch (refreshError) {
        resolvePendingQueue(refreshError);
        window.dispatchEvent(new CustomEvent("itap:admin-session-expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

if (typeof window !== "undefined") {
  window.addEventListener("itap:admin-session-expired", () => {
    import("../../features/admin-panel/store/adminAuthStore.js").then(({ useAdminAuthStore }) => {
      useAdminAuthStore.getState().clear();
    });
    window.location.replace("/admin-panel/login");
  });
}

export default adminAxiosClient;
