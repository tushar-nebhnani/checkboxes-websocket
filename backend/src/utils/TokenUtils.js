import crypto from "node:crypto";

export class TokenUtils {
  static generateOpaqueToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  static hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static expiryFromNow(ttlMs) {
    return new Date(Date.now() + ttlMs);
  }

  static isExpired(expiresAt) {
    return !expiresAt || expiresAt < new Date();
  }

  // Generates the (token, tokenHash, expiresAt) triple shared by every
  // opaque-token flow (refresh, password reset, email verification).
  static issue(ttlMs) {
    const token = TokenUtils.generateOpaqueToken();
    return {
      token,
      tokenHash: TokenUtils.hashToken(token),
      expiresAt: TokenUtils.expiryFromNow(ttlMs),
    };
  }
}
