import axiosClient from "../../../shared/lib/axiosClient.js";
import { supabase } from "../../../shared/lib/supabaseClient.js";
import { disconnectSocket } from "../../../shared/lib/socketClient.js";

// Model layer for auth. Implements the exact flow in docs/04-auth-security.md §2:
// 1) SPA signs in directly against Supabase Auth (steps 1-2)
// 2) SPA hands the resulting access token to Express, which verifies it and sets its own
//    httpOnly session cookie (steps 3-6)
export const authApi = {
  async login({ email, password }) {
    let supabaseResult;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      supabaseResult = data;
    } catch (err) {
      // #19: map the Supabase "Invalid login credentials" error to a user-friendly message.
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("invalid login") || msg.toLowerCase().includes("email not confirmed")) {
        throw new Error("Invalid email or password. Please check your credentials and try again.");
      }
      throw err;
    }
    const { data: session } = await axiosClient.post("/auth/session", {
      access_token: supabaseResult.session.access_token,
      refresh_token: supabaseResult.session.refresh_token,
    });
    return session.data;
  },

  async signup({ email, password, fullName, organizationName, inviteToken }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      // #19: surface Supabase's "User already registered" as a friendly message.
      const msg = error?.message || "";
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
        throw new Error("An account with this email already exists. Try signing in instead.");
      }
      throw error;
    }

    // #2: when Supabase email confirmation is enabled, signUp() returns session: null until
    // the user clicks the confirmation link. Return a sentinel so the UI can show the right
    // message instead of crashing on a null access_token.
    if (!data.session?.access_token) {
      return { requiresEmailConfirmation: true };
    }

    const { data: result } = await axiosClient.post("/auth/signup", {
      access_token: data.session.access_token,
      fullName,
      organizationName,
      inviteToken,
    });
    return result.data;
  },

  async logout() {
    await axiosClient.post("/auth/logout");
    // #20: disconnect the socket so it doesn't linger as an authenticated connection after
    // the session cookie is cleared. The singleton is reconnected on the next login.
    disconnectSocket();
    await supabase.auth.signOut();
  },

  async me() {
    const { data } = await axiosClient.get("/auth/me");
    return data.data;
  },

  async forgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
};
