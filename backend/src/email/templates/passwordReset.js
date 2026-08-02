import { EmailLayout } from "./layout.js";

export class PasswordResetEmailTemplate {
  static build({ link, expiresInMinutes }) {
    const subject = "Reset your password";

    const html = EmailLayout.render({
      preheader: "Use this link to reset your password.",
      heading: "Reset your password",
      bodyHtml: `
      <p style="margin: 0 0 12px;">We received a request to reset the password for your account.</p>
      <p style="margin: 0;">This link expires in ${expiresInMinutes} minutes.</p>
    `,
      button: { text: "Reset password", url: link },
      footerNote: "If you didn't request a password reset, you can safely ignore this email — your password won't change.",
    });

    const text = [
      "Reset your password",
      "",
      "We received a request to reset the password for your account.",
      `This link expires in ${expiresInMinutes} minutes.`,
      "",
      link,
      "",
      "If you didn't request a password reset, you can safely ignore this email — your password won't change.",
    ].join("\n");

    return { subject, html, text };
  }
}
