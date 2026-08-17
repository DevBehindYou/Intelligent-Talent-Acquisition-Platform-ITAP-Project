import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import axios from "axios";
import { env } from "./env.js";

// Verifies a raw Supabase Auth access token — used only at login/signup/refresh time
// (docs/04-auth-security.md §2, steps 3-4). Supports both signing schemes Supabase issues:
// symmetric (HS256, legacy projects, verified against SUPABASE_JWT_SECRET) and asymmetric
// (RS256/ES256, current projects, verified against the project's JWKS endpoint).
const jwks = env.supabaseJwksUrl
  ? jwksClient({ jwksUri: env.supabaseJwksUrl, cache: true, cacheMaxAge: 60 * 60 * 1000 })
  : null;

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

export function verifySupabaseAccessToken(token) {
  return new Promise((resolve, reject) => {
    if (env.supabaseJwtSecret) {
      jwt.verify(token, env.supabaseJwtSecret, { algorithms: ["HS256"] }, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
      return;
    }
    if (!jwks) {
      return reject(new Error("No SUPABASE_JWT_SECRET or SUPABASE_JWKS_URL configured"));
    }
    jwt.verify(token, getKey, { algorithms: ["RS256", "ES256"] }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

// Exchanges a Supabase refresh token for a fresh session (access + rotated refresh token)
// via the GoTrue REST endpoint. Runs server-side so the SPA never handles tokens — the
// refresh token lives only in the httpOnly itap_refresh cookie (docs/04-auth-security.md §2,
// step 7). Requires SUPABASE_ANON_KEY (falls back to the service role key as the apikey).
export async function refreshSupabaseSession(refreshToken) {
  const apiKey = env.supabaseAnonKey || env.supabaseServiceRoleKey;
  if (!env.supabaseUrl || !apiKey) {
    throw new Error("Supabase not configured for refresh (need SUPABASE_URL + SUPABASE_ANON_KEY)");
  }
  const { data } = await axios.post(
    `${env.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    { refresh_token: refreshToken },
    { headers: { apikey: apiKey, "Content-Type": "application/json" }, timeout: 10000 }
  );
  return data; // { access_token, refresh_token, expires_in, ... }
}
