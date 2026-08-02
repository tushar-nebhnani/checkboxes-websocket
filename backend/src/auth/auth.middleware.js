import { AppError } from "../utils/AppError.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { AuthUtils } from "./auth.utils.js";

export class AuthMiddleware {
  static requireAuth(req, res, next) {
    const token = req.cookies?.[AuthUtils.ACCESS_TOKEN_COOKIE];

    try {
      if (!token) {
        throw new AppError("Missing access token", 401, "MISSING_ACCESS_TOKEN");
      }
      req.user = AuthUtils.verifyAccessToken(token);
      next();
    } catch (err) {
      if (err instanceof AppError) {
        return ErrorHandler.handleControllerError(err, res, "AuthMiddleware.requireAuth");
      }
      ErrorHandler.handleControllerError(
        new AppError("Invalid or expired access token", 401, "INVALID_ACCESS_TOKEN"),
        res,
        "AuthMiddleware.requireAuth",
      );
    }
  }
}
