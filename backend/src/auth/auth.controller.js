import { AppError } from "../utils/AppError.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { AuthDTO } from "./auth.dto.js";
import { AuthService } from "./auth.service.js";
import { AuthUtils } from "./auth.utils.js";

export class AuthController {
  static async register(req, res) {
    try {
      const { email, password } = AuthDTO.registerRequest(req.body);
      const { user, accessToken, refreshToken } = await AuthService.registerUser(
        email,
        password,
      );
      AuthUtils.setAuthCookies(res, { accessToken, refreshToken });
      res.status(201).json({ user: AuthDTO.toUserResponse(user) });
    } catch (err) {
      ErrorHandler.handleControllerError(err, res, "AuthController.register");
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = AuthDTO.loginRequest(req.body);
      const { user, accessToken, refreshToken } = await AuthService.loginUser(email, password);
      AuthUtils.setAuthCookies(res, { accessToken, refreshToken });
      res.json({ user: AuthDTO.toUserResponse(user) });
    } catch (err) {
      ErrorHandler.handleControllerError(err, res, "AuthController.login");
    }
  }

  static async refresh(req, res) {
    try {
      const refreshToken = req.cookies?.[AuthUtils.REFRESH_TOKEN_COOKIE];
      if (!refreshToken) {
        throw new AppError("Missing refresh token", 401, "MISSING_REFRESH_TOKEN");
      }

      const result = await AuthService.refreshSession(refreshToken);
      AuthUtils.setAuthCookies(res, result);
      res.status(204).end();
    } catch (err) {
      if (err instanceof AppError && err.code === "INVALID_REFRESH_TOKEN") {
        AuthUtils.clearAuthCookies(res);
      }
      ErrorHandler.handleControllerError(err, res, "AuthController.refresh");
    }
  }

  static async logout(req, res) {
    try {
      const refreshToken = req.cookies?.[AuthUtils.REFRESH_TOKEN_COOKIE];
      await AuthService.logoutUser(refreshToken);
      AuthUtils.clearAuthCookies(res);
      res.status(204).end();
    } catch (err) {
      ErrorHandler.handleControllerError(err, res, "AuthController.logout");
    }
  }

  static async me(req, res) {
    try {
      const user = await AuthService.getUserById(req.user.sub);
      res.json({ user: AuthDTO.toUserResponse(user) });
    } catch (err) {
      ErrorHandler.handleControllerError(err, res, "AuthController.me");
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = AuthDTO.forgotPasswordRequest(req.body);
      await AuthService.requestPasswordReset(email);
      res.json({ message: "If that email is registered, a reset link has been sent" });
    } catch (err) {
      ErrorHandler.handleControllerError(err, res, "AuthController.forgotPassword");
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, password } = AuthDTO.resetPasswordRequest(req.body);
      await AuthService.resetPassword(token, password);
      res.json({ message: "Password has been reset" });
    } catch (err) {
      ErrorHandler.handleControllerError(err, res, "AuthController.resetPassword");
    }
  }

  static async verifyEmail(req, res) {
    try {
      const { token } = AuthDTO.verifyEmailRequest(req.body);
      await AuthService.verifyEmail(token);
      res.json({ message: "Email verified" });
    } catch (err) {
      ErrorHandler.handleControllerError(err, res, "AuthController.verifyEmail");
    }
  }

  static async resendVerification(req, res) {
    try {
      const { email } = AuthDTO.resendVerificationRequest(req.body);
      await AuthService.resendVerificationEmail(email);
      res.json({
        message: "If that email is registered and unverified, a new link has been sent",
      });
    } catch (err) {
      ErrorHandler.handleControllerError(err, res, "AuthController.resendVerification");
    }
  }
}
