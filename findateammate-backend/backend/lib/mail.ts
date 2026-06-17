
import nodemailer from "nodemailer";
import { logger } from "./logger";
import { MailOptions } from "nodemailer/lib/json-transport";

// --- Configuration ---
export class NodemailerProvider {
  transporter: nodemailer.Transporter;

  constructor() {
    // SECURITY FIX: Require SMTP credentials in production
    if (!process.env.SMTP_USER && process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: SMTP_USER environment variable must be set in production");
    }
    if (!process.env.SMTP_PASS && process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: SMTP_PASS environment variable must be set in production");
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
          // SECURITY FIX: Only disable certificate verification in development
          rejectUnauthorized: process.env.NODE_ENV === "production"
      }
    });
  }

  async send(options: MailOptions): Promise<boolean> {
    try {
      const from = process.env.SMTP_FROM || '"FindATeammate Support" <support@findateammate.online>';
      const info = await this.transporter.sendMail({
        from: from,
        ...options,
      });
      logger.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error("Nodemailer send error:", error);
      return false;
    }
  }
}

export const mailProvider = new NodemailerProvider();

// --- Pro Templates ---

const BRAND_COLOR = "#2563eb";
// const LOGO_URL = "https://findateammate.online/logo.png"; 
const FOOTER_TEXT = "© 2026 FindATeammate. All rights reserved.";

function getBaseTemplate(content: string, title: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: ${BRAND_COLOR}; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .logo-text-accent { color: #93c5fd; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; padding: 14px 28px; background-color: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; transition: background-color 0.2s; text-align: center; }
        .button:hover { background-color: #1d4ed8; }
        .footer { background: #f1f5f9; padding: 25px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .alert { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; color: #991b1b; border-radius: 4px; }
        .alert-title { font-weight: 700; display: block; margin-bottom: 4px; color: #7f1d1d; }
        h2 { color: #0f172a; margin-top: 0; font-size: 22px; }
        ul { padding-left: 20px; margin-bottom: 25px; }
        li { margin-bottom: 10px; }
        hr { border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Find<span class="logo-text-accent">A</span>Teammate</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>${FOOTER_TEXT}</p>
          <p>You received this email because you have an account on FindATeammate.<br/>
          <a href="${process.env.FRONTEND_URL}" style="color: #64748b; text-decoration: underline;">Unsubscribe options</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendWelcomeEmail(email: string, name: string) {
  const subject = "Welcome to the Community! 🚀";
  const content = `
    <h2>Hello ${name},</h2>
    <p>Welcome to <strong>FindATeammate</strong>! You've just joined a community of builders, designers, and visionaries ready to create something amazing.</p>
    
    <p>Here is what you can do right now:</p>
    <ul>
      <li><strong>Complete Profile:</strong> Showcase your skills and portfolio.</li>
      <li><strong>Post a Request:</strong> Find the perfect teammate for your idea.</li>
      <li><strong>Connect:</strong> Chat with others in real-time.</li>
    </ul>

    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/teammates" class="button">Start Browsing</a>
    </div>
    
    <hr/>
    <p>We can't wait to see what you build!</p>
    <p>— The FindATeammate Team</p>
  `;

  return await mailProvider.send({
    to: email,
    subject,
    text: `Welcome to FindATeammate, ${name}! Log in to start browsing.`,
    html: getBaseTemplate(content, "Welcome!"),
  });
}

export async function sendResolutionEmail(email: string, reportId: number, notes: string) {
  const subject = `Update on Report #${reportId}`;
  const content = `
    <h2>Report Resolved</h2>
    <p>We're writing to let you know that your report (ID: <strong>#${reportId}</strong>) has been reviewed and resolved.</p>
    
    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <strong style="color: #475569; display: block; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Admin Notes</strong>
      ${notes}
    </div>

    <p>Thank you for helping keep our community safe.</p>
  `;

  return await mailProvider.send({
    to: email,
    subject,
    text: `Your report #${reportId} has been resolved. Notes: ${notes}`,
    html: getBaseTemplate(content, "Report Update"),
  });
}

  // --- NEW: Email Notifications for User Actions ---

  export async function sendConnectionRequestEmail(
    recipientEmail: string, 
    recipientName: string, 
    senderName: string, 
    postTitle: string,
    message: string
  ) {
    const subject = `${senderName} wants to collaborate on "${postTitle}"`;
    const content = `
      <h2>Hello ${recipientName},</h2>
      <p><strong>${senderName}</strong> has sent you a connection request for your post:</p>
    
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <strong style="color: #0f172a; font-size: 18px; display: block; margin-bottom: 12px;">${postTitle}</strong>
        ${message ? `<p style="color: #475569; margin: 0;"><em>"${message}"</em></p>` : ''}
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/requests" class="button">View Request</a>
      </div>
    
      <p>Log in to accept or decline this request and start chatting!</p>
      <p>— The FindATeammate Team</p>
    `;

    return await mailProvider.send({
      to: recipientEmail,
      subject,
      text: `${senderName} sent you a connection request for "${postTitle}". Message: ${message}`,
      html: getBaseTemplate(content, "New Connection Request"),
    });
  }

  export async function sendEventRegistrationStatusEmail(
    userEmail: string,
    userName: string,
    eventName: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ) {
    const isApproved = status === "approved";
    const subject = isApproved 
      ? `✅ You're in! Registration approved for "${eventName}"` 
      : `Registration update for "${eventName}"`;
  
    const content = isApproved ? `
      <h2>Congratulations ${userName}! 🎉</h2>
      <p>Your registration for <strong>${eventName}</strong> has been <span style="color: #16a34a; font-weight: 700;">approved</span>!</p>
    
      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="color: #15803d; margin: 0; font-weight: 600;">You're all set to participate! Check your dashboard for next steps.</p>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/events" class="button">View Event Details</a>
      </div>
    ` : `
      <h2>Hello ${userName},</h2>
      <p>Thank you for your interest in <strong>${eventName}</strong>.</p>
    
      <div class="alert">
        <span class="alert-title">Registration Not Approved</span>
        Unfortunately, your registration was not approved at this time.
        ${rejectionReason ? `<br/><br/><strong>Reason:</strong> ${rejectionReason}` : ''}
      </div>

      <p>Don't be discouraged! There are plenty of other amazing events and opportunities on FindATeammate.</p>
    
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/events" class="button">Browse More Events</a>
      </div>
    `;

    return await mailProvider.send({
      to: userEmail,
      subject,
      text: isApproved 
        ? `Your registration for "${eventName}" has been approved!` 
        : `Your registration for "${eventName}" was not approved. ${rejectionReason || ''}`,
      html: getBaseTemplate(content, "Event Registration Update"),
    });
  }

  export async function sendNewChatMessageEmail(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    messagePreview: string
  ) {
    const subject = `New message from ${senderName}`;
    const truncatedMessage = messagePreview.length > 100 
      ? messagePreview.substring(0, 100) + "..." 
      : messagePreview;
  
    const content = `
      <h2>Hello ${recipientName},</h2>
      <p><strong>${senderName}</strong> sent you a message:</p>
    
      <div style="background-color: #f8fafc; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; border-radius: 8px; margin: 25px 0; font-style: italic; color: #475569;">
        "${truncatedMessage}"
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/chat" class="button">Reply Now</a>
      </div>
    
      <p style="font-size: 13px; color: #64748b;">You're receiving this because you have chat notifications enabled.</p>
    `;

    return await mailProvider.send({
      to: recipientEmail,
      subject,
      text: `New message from ${senderName}: ${truncatedMessage}`,
      html: getBaseTemplate(content, "New Message"),
    });
  }

  export async function sendPostExpiringEmail(
    userEmail: string,
    userName: string,
    postTitle: string,
    _postId: string,
    daysLeft: number
  ) {
    const subject = `⏰ Your post "${postTitle}" expires in ${daysLeft} days`;
    const content = `
      <h2>Hello ${userName},</h2>
      <p>Your post <strong>"${postTitle}"</strong> will expire in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
    
      <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="color: #92400e; margin: 0;">If you're still looking for teammates, consider updating your post or creating a new one to stay visible!</p>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/my-posts" class="button">Manage My Posts</a>
      </div>
    `;

    return await mailProvider.send({
      to: userEmail,
      subject,
      text: `Your post "${postTitle}" expires in ${daysLeft} days. Update it to stay visible!`,
      html: getBaseTemplate(content, "Post Expiring Soon"),
    });
  }
