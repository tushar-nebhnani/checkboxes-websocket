import nodemailer from "nodemailer";

import { ErrorHandler } from "../utils/ErrorHandler.js";
import { PasswordResetEmailTemplate } from "./templates/passwordReset.js";
import { VerificationEmailTemplate } from "./templates/verification.js";

const SMTP_HOST = process.env.SMTP_HOST;
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Checkboxes <no-reply@checkboxes.local>";
const APP_URL = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const RESET_TOKEN_TTL_MINUTES = Number(
  process.env.RESET_TOKEN_TTL_MINUTES ?? 30,
);
const EMAIL_VERIFICATION_TTL_HOURS = Number(
  process.env.EMAIL_VERIFICATION_TTL_HOURS ?? 24,
);

const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    })
  : null;

export class EmailService {
  static async sendVerificationEmail(to, token) {
    try {
      const link = `${APP_URL}/verify-email?token=${token}`;
      const { subject, html, text } = VerificationEmailTemplate.build({
        link,
        expiresInHours: EMAIL_VERIFICATION_TTL_HOURS,
      });
      await EmailService.#sendEmail({ to, subject, text, html });
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "EmailService.sendVerificationEmail");
    }
  }

  static async sendPasswordResetEmail(to, token) {
    try {
      const link = `${APP_URL}/reset-password?token=${token}`;
      const { subject, html, text } = PasswordResetEmailTemplate.build({
        link,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      });
      await EmailService.#sendEmail({ to, subject, text, html });
    } catch (err) {
      throw ErrorHandler.wrapServiceError(err, "EmailService.sendPasswordResetEmail");
    }
  }

  static async #sendEmail({ to, subject, text, html }) {
    if (!transporter) {
      console.log(
        `[email] SMTP not configured — logging instead of sending.\nTo: ${to}\nSubject: ${subject}\n${text}`,
      );
      return;
    }

    await transporter.sendMail({ from: EMAIL_FROM, to, subject, text, html });
    console.log(`[email] sent "${subject}" to ${to}`);
  }
}
