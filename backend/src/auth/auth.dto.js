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
