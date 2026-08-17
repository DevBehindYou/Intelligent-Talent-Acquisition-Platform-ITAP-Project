import axios from "axios";

// Model layer: the only place in the app that knows how HTTP requests are made.
// Feature `*Api.js` files import this client; View/ViewModel code never imports axios directly
// (see docs/01-technical-architecture.md §3, MVVM boundary rules).
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  withCredentials: true, // sends the httpOnly itap_session / itap_refresh cookies (see docs/04-auth-security.md)
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest", // defense-in-depth CSRF header, per docs/04-auth-security.md §3
  },
});

let isRefreshing = false;
let pendingQueue = [];

function resolvePendingQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // On a 401 (expired session cookie), try one silent refresh before giving up —
    // mirrors the flow in docs/04-auth-security.md §2, step 7.
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/")) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => axiosClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await axiosClient.post("/auth/refresh");
        resolvePendingQueue(null);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        resolvePendingQueue(refreshError);
        window.dispatchEvent(new CustomEvent("itap:session-expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// #21: listen for the session-expired event dispatched by the refresh interceptor above.
// Clears the Zustand auth store and redirects to /login so the user isn't silently stuck
// on a page that keeps returning 401s.
// Uses a dynamic import to avoid a circular dependency:
//   axiosClient → authStore → (via authApi) → axiosClient
if (typeof window !== "undefined") {
  window.addEventListener("itap:session-expired", () => {
    // Dynamic import is safe here — the event only fires long after all modules load.
    import("../../features/auth/store/authStore.js").then(({ useAuthStore }) => {
      useAuthStore.getState().clear();
    });
    // Use replace so the user can't navigate back into the authenticated shell.
    window.location.replace("/login");
  });
}

export default axiosClient;
