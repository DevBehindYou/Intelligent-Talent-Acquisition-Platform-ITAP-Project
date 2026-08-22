import axios from "axios";

// Separate axios instance for the candidate portal. Same API origin as the staff client, but
// its silent-refresh hits the candidate refresh endpoint and its session-expired handling sends
// the user to the candidate login — keeping the two portals fully isolated (docs/13 §1.2, §3.2).
const candidateAxiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  withCredentials: true, // sends the httpOnly itap_session / itap_refresh cookies
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest", // defense-in-depth CSRF header
  },
});

let isRefreshing = false;
let pendingQueue = [];

function resolvePendingQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
}

candidateAxiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // On a 401, try one silent refresh against the CANDIDATE refresh endpoint. The url.includes
    // "/auth/" guard keeps the refresh call itself from recursing.
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/")) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => candidateAxiosClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await candidateAxiosClient.post("/candidate/auth/refresh");
        resolvePendingQueue(null);
        return candidateAxiosClient(originalRequest);
      } catch (refreshError) {
        resolvePendingQueue(refreshError);
        window.dispatchEvent(new CustomEvent("itap:candidate-session-expired"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Clear the candidate auth store and bounce to the candidate login when refresh ultimately fails.
// Dynamic import avoids a circular dependency (client → store → api → client).
if (typeof window !== "undefined") {
  window.addEventListener("itap:candidate-session-expired", () => {
    import("../../features/candidate-portal/store/candidateAuthStore.js").then(({ useCandidateAuthStore }) => {
      useCandidateAuthStore.getState().clear();
    });
    window.location.replace("/candidate/login");
  });
}

export default candidateAxiosClient;
