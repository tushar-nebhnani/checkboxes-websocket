const BRAND_NAME = "Checkboxes";
const BRAND_COLOR = "#4f46e5";
const TEXT_COLOR = "#1f2937";
const MUTED_COLOR = "#6b7280";
const BORDER_COLOR = "#e5e7eb";
const BACKGROUND_COLOR = "#f3f4f6";

export class EmailLayout {
  // Table-based layout + inline styles, since that's what actually renders
  // consistently across email clients (Gmail, Outlook, Apple Mail, ...).
  static render({ preheader, heading, bodyHtml, button, footerNote }) {
    const buttonHtml = button
      ? `
      <tr>
        <td align="center" style="padding: 32px 0 8px;">
          <a href="${button.url}" target="_blank" rel="noopener noreferrer"
            style="background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; display: inline-block;">
            ${button.text}
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 0 24px; color: ${MUTED_COLOR}; font-size: 13px; line-height: 20px; word-break: break-all;">
          Or copy and paste this link into your browser:<br />
          <a href="${button.url}" target="_blank" rel="noopener noreferrer" style="color: ${BRAND_COLOR};">${button.url}</a>
        </td>
      </tr>
    `
      : "";

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${BACKGROUND_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader ?? ""}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BACKGROUND_COLOR}; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; border: 1px solid ${BORDER_COLOR};">
            <tr>
              <td style="padding: 24px 24px 0; text-align: center;">
                <span style="font-size: 18px; font-weight: 700; color: ${TEXT_COLOR};">${BRAND_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 24px 0;">
                <h1 style="margin: 0 0 12px; font-size: 20px; color: ${TEXT_COLOR};">${heading}</h1>
                <div style="font-size: 15px; line-height: 22px; color: ${TEXT_COLOR};">${bodyHtml}</div>
              </td>
            </tr>
            ${buttonHtml}
            <tr>
              <td style="padding: 24px; border-top: 1px solid ${BORDER_COLOR}; margin-top: 24px; font-size: 12px; line-height: 18px; color: ${MUTED_COLOR};">
                ${footerNote ?? "If you didn't request this, you can safely ignore this email."}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }
}
