// Explicit allow-lists for every auth API call: request DTOs strip any
// extra fields a client might send (defense-in-depth against mass
// assignment even if a route's validation schema is ever loosened), and
// the response DTO keeps sensitive columns (password_hash, token hashes)
// from ever reaching the wire.
export class AuthDTO {
  static toUserResponse(row) {
    return {
      id: row.id,
      email: row.email,
      createdAt: row.created_at,
      emailVerified: Boolean(row.email_verified_at),
    };
  }

  static registerRequest(body) {
    return { email: body.email, password: body.password };
  }

  static loginRequest(body) {
    return { email: body.email, password: body.password };
  }

  static forgotPasswordRequest(body) {
    return { email: body.email };
  }

  static resetPasswordRequest(body) {
    return { token: body.token, password: body.password };
  }

  static verifyEmailRequest(body) {
    return { token: body.token };
  }

  static resendVerificationRequest(body) {
    return { email: body.email };
  }
}
