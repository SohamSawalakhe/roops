import "./env.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a password reset OTP email via Resend.
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
export async function sendOtpEmail(toEmail, otp) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !toEmail) {
    console.warn("[Mailer] RESEND_API_KEY or ADMIN_EMAIL not configured. Skipping email.");
    return;
  }

  const { error } = await resend.emails.send({
    from: "Roop Sari Palace <noreply@roopsaripalace.com>",
    to: [toEmail],
    subject: "Admin Password Reset OTP",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Password Reset</title>
      </head>
      <body style="margin:0;padding:0;background:#faf6f3;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f3;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#b79e8c 0%,#836957 100%);padding:36px 40px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.7);letter-spacing:0.15em;text-transform:uppercase;">Roop Sari Palace</p>
                    <h1 style="margin:0;font-size:26px;font-weight:600;color:#ffffff;">Password Reset</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.6;">
                      You requested a password reset for the Admin Panel. Use the OTP below to set a new password.
                    </p>
                    <!-- OTP Box -->
                    <div style="background:#faf6f3;border:2px solid #e6e0db;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
                      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#836957;letter-spacing:0.15em;text-transform:uppercase;">Your One-Time Code</p>
                      <p style="margin:0;font-size:42px;font-weight:700;letter-spacing:0.35em;color:#1a1a1a;font-family:monospace;">${otp}</p>
                    </div>
                    <p style="margin:0 0 8px;font-size:13px;color:#888;text-align:center;">
                      ⏱ This code expires in <strong>15 minutes</strong>.
                    </p>
                    <p style="margin:16px 0 0;font-size:13px;color:#aaa;text-align:center;">
                      If you didn't request this, you can safely ignore this email. Your password won't change.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f5f0ec;padding:20px 40px;text-align:center;border-top:1px solid #ebe5e0;">
                    <p style="margin:0;font-size:12px;color:#aaa;">Roop Sari Palace · Indian Ethnic Wear</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error("[Mailer] Failed to send OTP email:", error);
    throw new Error("Email delivery failed");
  }

  console.log(`[Mailer] OTP email sent to ${toEmail}`);
}
