import { generateSecret, generateSync, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";

// TOTP helpers for admin MFA (docs/13 §14), using otplib v13's functional API.
const ISSUER = "ITAP Platform Admin";

export function generateMfaSecret(email) {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ secret, label: email || "admin", issuer: ISSUER });
  return { secret, otpauthUrl };
}

export function verifyTotp(secret, token) {
  if (!secret || !token) return false;
  try {
    return verifySync({ token: String(token).trim(), secret }).valid === true;
  } catch {
    return false;
  }
}

// Current code for a secret — used by tests (and never exposed over the API).
export function generateTotpCode(secret) {
  return generateSync({ secret });
}

// Renders the otpauth URI as a QR data URL for authenticator-app enrollment.
export function qrDataUrl(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl);
}
