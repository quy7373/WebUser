import nodemailer from 'nodemailer';
import { escapeHtml } from '../utils/security.js';

/**
 * Business Layer - Email Service (CovAI Branding)
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.GOOGLE_APP_KEY || process.env.GMAIL_APP_KEY || process.env.GMAIL_APP_PASSWORD;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;

    if (user && pass && pass !== 'your-app-password') {
      this.transporter = nodemailer.createTransport({
        service: host.includes('gmail') ? 'gmail' : undefined,
        host: host.includes('gmail') ? undefined : host,
        port: host.includes('gmail') ? undefined : port,
        secure: port === 465,
        auth: {
          user: user,
          pass: pass.replace(/\s+/g, ''),
        },
      });
      console.log('📧 EmailService: Đã kết nối Gmail / SMTP Server thật với tài khoản:', user);
    } else {
      this.transporter = null;
      console.log('ℹ️ EmailService: Đang chạy ở chế độ Development (mô phỏng gửi email).');
    }
  }

  /**
   * Gửi email mời tham gia CovAI theo đúng mẫu thương hiệu CovAI
   * @param {Object} params
   * @param {string} params.to
   * @param {string} params.name
   * @param {string} params.role
   * @param {string} params.invitationUrl
   * @param {Date} params.expiresAt
   */
  async sendCovAiInvitationEmail({ to, name, role, invitationUrl, expiresAt }) {
    const from = process.env.SMTP_FROM || '"Web" <duyquy@web.dev>';
    const subject = 'You have been invited to join CovAI';

    const safe = {
      name: escapeHtml(name || to),
      email: escapeHtml(to),
      role: escapeHtml(role || 'USER'),
      url: escapeHtml(invitationUrl),
      expiry: escapeHtml(new Date(expiresAt).toUTCString()),
    };

    const textMessage = `Hello ${safe.name},\n\nYou have been invited to join CovAI with the role: ${safe.role}.\n\nPlease click the link below to accept your invitation and set up your password:\n${invitationUrl}\n\nNotice: This invitation will expire on ${safe.expiry}.\nIf you were not expecting this invitation, you can safely ignore this email.\n\nBest regards,\nCovAI Team`;

    const htmlMessage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You have been invited to join CovAI</title>
  <style>
    body { margin:0; padding:0; background-color:#f4f5f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1e293b; }
    .container { max-width: 580px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background-color: #10151d; padding: 24px 32px; display: flex; align-items: center; }
    .badge-icon { width: 32px; height: 32px; border-radius: 8px; background-color: #6d5dfb; color: #ffffff; font-family: monospace; font-size: 16px; font-weight: bold; text-align: center; line-height: 32px; display: inline-block; vertical-align: middle; }
    .brand-title { display: inline-block; vertical-align: middle; margin-left: 12px; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .body { padding: 36px 32px; }
    .eyebrow { color: #6d5dfb; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 20px; line-height: 1.3; }
    .desc { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
    .info-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px; }
    .info-row { margin-bottom: 8px; font-size: 14px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #64748b; font-weight: 600; width: 110px; display: inline-block; }
    .info-value { color: #0f172a; font-weight: 700; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { background-color: #6d5dfb; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(109, 93, 251, 0.3); }
    .url-box { background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 12px; color: #475569; word-break: break-all; margin-top: 20px; }
    .footer { padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge-icon">&gt;_</div>
      <span class="brand-title">CovAI</span>
    </div>
    <div class="body">
      <div class="eyebrow">Account Invitation</div>
      <h1 class="title">You have been invited to join CovAI</h1>
      <p class="desc">
        Hello <strong>${safe.name}</strong>,<br>
        An administrator has invited you to join the <strong>CovAI</strong> platform. To activate your account and start collaborating, please confirm your invitation below and set your account password.
      </p>

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Invited Email:</span>
          <span class="info-value">${safe.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Assigned Role:</span>
          <span class="info-value" style="color: #6d5dfb;">${safe.role}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Expires At:</span>
          <span class="info-value">${safe.expiry}</span>
        </div>
      </div>

      <div class="btn-container">
        <a href="${safe.url}" class="btn" target="_blank">Confirm Invitation</a>
      </div>

      <div class="url-box">
        <strong>Direct link:</strong><br>
        ${safe.url}
      </div>
    </div>
    <div class="footer">
      <strong>Important:</strong> This invitation link is personal and will expire in 24 hours.<br>
      If you were not expecting this invitation, you can safely ignore this email — no account will be activated without confirmation.
    </div>
  </div>
</body>
</html>
    `;

    if (this.transporter) {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text: textMessage,
        html: htmlMessage,
      });
      console.log(`✅ [EmailService] Đã gửi email mời CovAI tới: ${to} (MessageID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    }

    // Chế độ mô phỏng / Development (không in token thô trong log thông thường, chỉ in link xác nhận)
    console.log('\n======================================================');
    console.log('📨 [COVAI DEV EMAIL] INVITATION EMAIL DISPATCHED:');
    console.log(`➡️ Recipient: ${name} <${to}>`);
    console.log(`🔑 Role: ${role}`);
    console.log(`🔗 Verification URL: ${invitationUrl}`);
    console.log('======================================================\n');

    return {
      success: true,
      simulated: true,
      confirmationUrl: invitationUrl,
    };
  }
}

export default new EmailService();
