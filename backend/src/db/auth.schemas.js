import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(312);
const newPassword = z.string().min(8).max(72);

export class AuthSchemas {
  static register = z.object({
    email,
    password: newPassword,
  });

  static login = z.object({
    email,
    password: z.string().min(1),
  });

  static forgotPassword = z.object({
    email,
  });

  static resetPassword = z.object({
    token: z.string().min(1),
    password: newPassword,
  });

  static verifyEmail = z.object({
    token: z.string().min(1),
  });

  static resendVerification = z.object({
    email,
  });
}
