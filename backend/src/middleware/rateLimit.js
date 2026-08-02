import rateLimit from "express-rate-limit";

const RATE_LIMIT_MESSAGE = {
  error: "Too many requests, please try again later",
};

export class RateLimiters {
  static passwordReset = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: RATE_LIMIT_MESSAGE,
  });

  static emailVerification = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: RATE_LIMIT_MESSAGE,
  });

  static auth = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: RATE_LIMIT_MESSAGE,
  });

  // Refresh fires automatically every ~13 minutes per open tab, so it needs
  // more headroom than the login/register limiter.
  static session = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: RATE_LIMIT_MESSAGE,
  });
}
