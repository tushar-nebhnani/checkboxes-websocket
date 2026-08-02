import { Router } from "express";

import { AuthSchemas } from "../db/auth.schemas.js";
import { CsrfGuard } from "../middleware/csrf.js";
import { RateLimiters } from "../middleware/rateLimit.js";
import { Validator } from "../middleware/validate.js";
import { AuthController } from "./auth.controller.js";
import { AuthMiddleware } from "./auth.middleware.js";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

export class AuthRoutes {
  static router = Router();

  static {
    AuthRoutes.router.use(CsrfGuard.verifyOrigin(CLIENT_ORIGIN));

    AuthRoutes.router.post(
      "/register",
      RateLimiters.auth,
      Validator.validate(AuthSchemas.register),
      AuthController.register,
    );

    AuthRoutes.router.post(
      "/login",
      RateLimiters.auth,
      Validator.validate(AuthSchemas.login),
      AuthController.login,
    );

    AuthRoutes.router.get("/health", (req, res) => res.json({ healthy: true }));
    AuthRoutes.router.get("/", (req, res) =>
      res.json({ message: "Server is running..." }),
    );

    AuthRoutes.router.post(
      "/refresh",
      RateLimiters.session,
      AuthController.refresh,
    );

    AuthRoutes.router.post(
      "/logout",
      RateLimiters.session,
      AuthController.logout,
    );

    AuthRoutes.router.get("/me", AuthMiddleware.requireAuth, AuthController.me);

    AuthRoutes.router.post(
      "/forgot-password",
      RateLimiters.passwordReset,
      Validator.validate(AuthSchemas.forgotPassword),
      AuthController.forgotPassword,
    );

    AuthRoutes.router.post(
      "/reset-password",
      RateLimiters.passwordReset,
      Validator.validate(AuthSchemas.resetPassword),
      AuthController.resetPassword,
    );

    AuthRoutes.router.post(
      "/verify-email",
      RateLimiters.emailVerification,
      Validator.validate(AuthSchemas.verifyEmail),
      AuthController.verifyEmail,
    );

    AuthRoutes.router.post(
      "/resend-verification",
      RateLimiters.emailVerification,
      Validator.validate(AuthSchemas.resendVerification),
      AuthController.resendVerification,
    );
  }
}
