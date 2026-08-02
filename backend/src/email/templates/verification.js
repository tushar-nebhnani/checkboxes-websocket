import { EmailLayout } from "./layout.js";

export class VerificationEmailTemplate {
  static build({ link, expiresInHours }) {
    const subject = "Verify your email address";

    const html = EmailLayout.render({
      preheader: "Confirm your email address to finish setting up your account.",
      heading: "Verify your email",
      bodyHtml: `
      <p style="margin: 0 0 12px;">Thanks for signing up! Please confirm this is your email address to activate your account.</p>
      <p style="margin: 0;">This link expires in ${expiresInHours} hour${expiresInHours === 1 ? "" : "s"}.</p>
    `,
      button: { text: "Verify email", url: link },
      footerNote: "If you didn't create an account, you can safely ignore this email.",
    });

    const text = [
      "Verify your email address",
      "",
      "Thanks for signing up! Please confirm this is your email address to activate your account.",
      `This link expires in ${expiresInHours} hour${expiresInHours === 1 ? "" : "s"}.`,
      "",
      link,
      "",
      "If you didn't create an account, you can safely ignore this email.",
    ].join("\n");

    return { subject, html, text };
  }
}
