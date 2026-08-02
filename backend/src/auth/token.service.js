import { Database } from "../db/db.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { TokenUtils } from "../utils/TokenUtils.js";

const REFRESH_TOKEN_TTL_MS =
  Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30) * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS =
  Number(process.env.RESET_TOKEN_TTL_MINUTES ?? 30) * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS =
  Number(process.env.EMAIL_VERIFICATION_TTL_HOURS ?? 24) * 60 * 60 * 1000;

export class TokenService {
  static async createRefreshToken(userId) {
    try {
      const { token, tokenHash, expiresAt } = TokenUtils.issue(REFRESH_TOKEN_TTL_MS);

      await Database.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [userId, tokenHash, expiresAt],
      );

      return { token, expiresAt };
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "TokenService.createRefreshToken");
    }
  }

  static async rotateRefreshToken(oldToken) {
    try {
      const tokenHash = TokenUtils.hashToken(oldToken);

      const { rows } = await Database.query(
        `SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`,
        [tokenHash],
      );
      const record = rows[0];
      if (!record) return null;

      if (record.revoked_at) {
        // This token was already rotated away once; presenting it again
        // means it was copied (theft/replay). Contain the blast radius by
        // killing every session for this user rather than just this token.
        await TokenService.revokeAllRefreshTokensForUser(record.user_id);
        return null;
      }

      if (record.expires_at < new Date()) return null;

      await Database.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1`, [
        record.id,
      ]);

      const { token, expiresAt } = await TokenService.createRefreshToken(record.user_id);
      return { userId: record.user_id, token, expiresAt };
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "TokenService.rotateRefreshToken");
    }
  }

  static async revokeRefreshToken(token) {
    try {
      const tokenHash = TokenUtils.hashToken(token);
      await Database.query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
        [tokenHash],
      );
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "TokenService.revokeRefreshToken");
    }
  }

  static async revokeAllRefreshTokensForUser(userId) {
    try {
      await Database.query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId],
      );
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "TokenService.revokeAllRefreshTokensForUser");
    }
  }

  static createPasswordResetToken(userId) {
    return TokenService.#issueUserToken(userId, {
      hashColumn: "reset_token_hash",
      expiresColumn: "reset_token_expires_at",
      ttlMs: RESET_TOKEN_TTL_MS,
      context: "TokenService.createPasswordResetToken",
    });
  }

  static consumePasswordResetToken(token) {
    return TokenService.#consumeUserToken(token, {
      hashColumn: "reset_token_hash",
      expiresColumn: "reset_token_expires_at",
      context: "TokenService.consumePasswordResetToken",
    });
  }

  static createEmailVerificationToken(userId) {
    return TokenService.#issueUserToken(userId, {
      hashColumn: "verification_token_hash",
      expiresColumn: "verification_token_expires_at",
      ttlMs: EMAIL_VERIFICATION_TTL_MS,
      context: "TokenService.createEmailVerificationToken",
    });
  }

  static consumeEmailVerificationToken(token) {
    return TokenService.#consumeUserToken(token, {
      hashColumn: "verification_token_hash",
      expiresColumn: "verification_token_expires_at",
      context: "TokenService.consumeEmailVerificationToken",
    });
  }

  // Password-reset and email-verification tokens both boil down to "store a
  // hash + expiry on a users column, then later look it up and clear it".
  // hashColumn/expiresColumn are fixed internal identifiers (never
  // user input), so interpolating them into the query text is safe.
  static async #issueUserToken(userId, { hashColumn, expiresColumn, ttlMs, context }) {
    try {
      const { token, tokenHash, expiresAt } = TokenUtils.issue(ttlMs);
      await Database.query(
        `UPDATE users SET ${hashColumn} = $1, ${expiresColumn} = $2 WHERE id = $3`,
        [tokenHash, expiresAt, userId],
      );
      return token;
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, context);
    }
  }

  static async #consumeUserToken(token, { hashColumn, expiresColumn, context }) {
    try {
      const tokenHash = TokenUtils.hashToken(token);

      const { rows } = await Database.query(
        `SELECT id, ${expiresColumn} AS expires_at FROM users WHERE ${hashColumn} = $1`,
        [tokenHash],
      );
      const record = rows[0];
      if (!record || TokenUtils.isExpired(record.expires_at)) {
        return null;
      }

      await Database.query(
        `UPDATE users SET ${hashColumn} = NULL, ${expiresColumn} = NULL WHERE id = $1`,
        [record.id],
      );

      return record.id;
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, context);
    }
  }
}
