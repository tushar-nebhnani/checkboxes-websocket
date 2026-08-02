import bcrypt from "bcryptjs";

import { Database } from "../db/db.js";
import { EmailService } from "../email/index.js";
import { AppError } from "../utils/AppError.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { AuthUtils } from "./auth.utils.js";
import { TokenService } from "./token.service.js";

const SALT_ROUNDS = 12;

export class AuthService {
  static async registerUser(email, password) {
    try {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const { rows } = await Database.query(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2)
         RETURNING id, email, created_at, email_verified_at`,
        [email, passwordHash],
      );
      const user = rows[0];

      const tokens = await AuthService.#issueTokens(user.id);

      const verificationToken = await TokenService.createEmailVerificationToken(
        user.id,
      );
      EmailService.sendVerificationEmail(user.email, verificationToken).catch(
        (err) => {
          ErrorHandler.log(
            "AuthService.registerUser:sendVerificationEmail",
            err,
          );
        },
      );

      return { user, ...tokens };
    } catch (err) {
      if (err.code === "23505") {
        throw new AppError(
          "Email already registered",
          409,
          "EMAIL_ALREADY_REGISTERED",
        );
      }
      throw ErrorHandler.wrapServiceError(err, "AuthService.registerUser");
    }
  }

  static async loginUser(email, password) {
    try {
      const { rows } = await Database.query(
        `SELECT id, email, password_hash, created_at, email_verified_at FROM users WHERE email = $1`,
        [email],
      );
      const user = rows[0];

      const valid = await bcrypt.compare(
        password,
        user?.password_hash ?? DUMMY_PASSWORD_HASH,
      );
      if (!user || !valid) {
        throw new AppError(
          "Invalid email or password",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      const tokens = await AuthService.#issueTokens(user.id);
      return { user, ...tokens };
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "AuthService.loginUser");
    }
  }

  static async refreshSession(oldRefreshToken) {
    try {
      const rotated = await TokenService.rotateRefreshToken(oldRefreshToken);
      if (!rotated) {
        throw new AppError(
          "Invalid or expired refresh token",
          401,
          "INVALID_REFRESH_TOKEN",
        );
      }

      const accessToken = AuthUtils.signAccessToken({ sub: rotated.userId });
      return { accessToken, refreshToken: rotated.token };
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "AuthService.refreshSession");
    }
  }

  static async logoutUser(refreshToken) {
    try {
      if (refreshToken) {
        await TokenService.revokeRefreshToken(refreshToken);
      }
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "AuthService.logoutUser");
    }
  }

  static async getUserById(id) {
    try {
      const { rows } = await Database.query(
        `SELECT id, email, created_at, email_verified_at FROM users WHERE id = $1`,
        [id],
      );
      const user = rows[0];
      if (!user) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
      }
      return user;
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "AuthService.getUserById");
    }
  }

  static async requestPasswordReset(email) {
    try {
      const { rows } = await Database.query(
        `SELECT id, email FROM users WHERE email = $1`,
        [email],
      );
      const user = rows[0];
      if (!user) return; // don't reveal whether the email is registered

      const token = await TokenService.createPasswordResetToken(user.id);
      EmailService.sendPasswordResetEmail(user.email, token).catch((err) => {
        ErrorHandler.log("AuthService.requestPasswordReset:sendEmail", err);
      });
    } catch (err) {
      throw ErrorHandler.wrapServiceError(
        err,
        "AuthService.requestPasswordReset",
      );
    }
  }

  static async resetPassword(token, newPassword) {
    try {
      const userId = await TokenService.consumePasswordResetToken(token);
      if (!userId) {
        throw new AppError(
          "Invalid or expired reset token",
          400,
          "INVALID_RESET_TOKEN",
        );
      }

      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await Database.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [passwordHash, userId],
      );
      await TokenService.revokeAllRefreshTokensForUser(userId);
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "AuthService.resetPassword");
    }
  }

  static async verifyEmail(token) {
    try {
      const userId = await TokenService.consumeEmailVerificationToken(token);
      if (!userId) {
        throw new AppError(
          "Invalid or expired verification token",
          400,
          "INVALID_VERIFICATION_TOKEN",
        );
      }

      await Database.query(
        `UPDATE users SET email_verified_at = now() WHERE id = $1`,
        [userId],
      );
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "AuthService.verifyEmail");
    }
  }

  static async resendVerificationEmail(email) {
    try {
      const { rows } = await Database.query(
        `SELECT id, email, email_verified_at FROM users WHERE email = $1`,
        [email],
      );
      const user = rows[0];
      if (!user || user.email_verified_at) return; // don't reveal existence; skip if already verified

      const token = await TokenService.createEmailVerificationToken(user.id);
      EmailService.sendVerificationEmail(user.email, token).catch((err) => {
        ErrorHandler.log("AuthService.resendVerificationEmail:sendEmail", err);
      });
    } catch (err) {
      throw ErrorHandler.wrapServiceError(
        err,
        "AuthService.resendVerificationEmail",
      );
    }
  }

  static async #issueTokens(userId) {
    const accessToken = AuthUtils.signAccessToken({ sub: userId });
    const { token: refreshToken } =
      await TokenService.createRefreshToken(userId);
    return { accessToken, refreshToken };
  }
}
