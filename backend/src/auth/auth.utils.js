import jwt from "jsonwebtoken";
import ms from "ms";

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m";
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET && isProduction) {
  throw new Error("JWT_SECRET environment variable must be set in production");
}
if (!process.env.JWT_SECRET) {
  console.warn(
    "[AuthUtils] JWT_SECRET not set — using an insecure default for local development only.",
  );
}
const JWT_SECRET = process.env.JWT_SECRET || "insecure-development-only-secret";

export class AuthUtils {
  static ACCESS_TOKEN_COOKIE = "access_token";
  static REFRESH_TOKEN_COOKIE = "refresh_token";

  static #baseCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  };

  static signAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  static verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  static getAccessTokenFromCookieHeader(cookieHeader) {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${AuthUtils.ACCESS_TOKEN_COOKIE}=([^;]*)`),
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  static setAuthCookies(res, { accessToken, refreshToken }) {
    res.cookie(AuthUtils.ACCESS_TOKEN_COOKIE, accessToken, {
      ...AuthUtils.#baseCookieOptions,
      maxAge: ms(ACCESS_TOKEN_EXPIRES_IN),
      path: "/",
    });
    res.cookie(AuthUtils.REFRESH_TOKEN_COOKIE, refreshToken, {
      ...AuthUtils.#baseCookieOptions,
      maxAge:
        Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30) * 24 * 60 * 60 * 1000,
      path: "/auth",
    });
  }

  static clearAuthCookies(res) {
    res.clearCookie(AuthUtils.ACCESS_TOKEN_COOKIE, {
      ...AuthUtils.#baseCookieOptions,
      path: "/",
    });
    res.clearCookie(AuthUtils.REFRESH_TOKEN_COOKIE, {
      ...AuthUtils.#baseCookieOptions,
      path: "/auth",
    });
  }
}
