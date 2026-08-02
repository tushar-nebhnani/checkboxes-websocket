import { AppError } from "../utils/AppError.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Auth cookies are SameSite=Lax, which already blocks cross-site POSTs in
// every modern browser. This is a defense-in-depth layer for the residual
// cases SameSite doesn't cover (browsers predating SameSite enforcement,
// same-site-but-different-subdomain attacks): every state-changing request
// must present an Origin (or Referer) that matches our own origin.
export class CsrfGuard {
  static verifyOrigin(allowedOrigin) {
    return (req, res, next) => {
      try {
        if (SAFE_METHODS.has(req.method)) return next();

        const sourceOrigin = req.headers.origin ?? originOf(req.headers.referer);
        if (!sourceOrigin || sourceOrigin !== allowedOrigin) {
          throw new AppError("Cross-origin request blocked", 403, "CSRF_ORIGIN_MISMATCH");
        }
        next();
      } catch (err) {
        ErrorHandler.handleControllerError(err, res, "CsrfGuard.verifyOrigin");
      }
    };
  }
}
