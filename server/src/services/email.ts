import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER
    ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
    : undefined,
});

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    console.log(`[Email — SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n`);
    return;
  }
  await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
}

const navy = '#0D1E2C';
const teal = '#1DB8A0';

function base(content: string): string {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body{font-family:'Jost',Arial,sans-serif;background:#F7FAF9;margin:0;padding:0;}
.wrap{max-width:600px;margin:32px auto;background:#fff;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
.header{background:${navy};padding:28px 32px;color:#fff;}
.header h1{margin:0;font-size:20px;font-weight:700;letter-spacing:0.02em;}
.header p{margin:4px 0 0;font-size:13px;color:#1DB8A0;letter-spacing:0.12em;text-transform:uppercase;}
.body{padding:32px;}
p{color:#374151;line-height:1.7;margin:0 0 16px;}
.btn{display:inline-block;background:${teal};color:#0D1E2C!important;text-decoration:none;padding:14px 32px;font-weight:700;font-size:15px;margin:16px 0;letter-spacing:0.04em;}
.cred-box{background:#E6F7F5;border-left:4px solid ${teal};padding:16px 20px;margin:16px 0;}
.cred-box p{margin:4px 0;color:#0D1E2C;font-size:15px;}
.cred-box .label{font-size:11px;color:#4A6670;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;}
.footer{padding:20px 32px;background:#F7FAF9;font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB;}
</style>
</head><body><div class="wrap">
<div class="header">
  <h1>${env.PROGRAM_NAME}</h1>
  <p>Skillyme Africa · Cohort 2</p>
</div>
<div class="body">${content}</div>
<div class="footer">© 2026 Skillyme Africa. Questions? <a href="mailto:${env.ADMIN_EMAIL}" style="color:#1DB8A0;">${env.ADMIN_EMAIL}</a></div>
</div></body></html>`;
}

export const emailService = {
  async sendApplicationConfirmation(opts: {
    to: string; firstName: string;
  }): Promise<void> {
    await send(
      opts.to,
      `Application received — Skillyme Africa Cohort 2`,
      base(`
<p>Hi ${opts.firstName},</p>
<p>Thank you for applying to <strong>${env.PROGRAM_NAME}</strong>. We've received your application and our team will review it.</p>
<p><strong>What happens next:</strong></p>
<ul style="color:#374151;line-height:1.8;padding-left:18px;">
  <li>Applications close <strong>Wednesday 17 June 2026</strong></li>
  <li>Selection and team matching: <strong>18–21 June 2026</strong></li>
  <li>Accepted applicants will receive an email with their login credentials</li>
  <li>Program starts: <strong>Monday 22 June 2026</strong></li>
</ul>
<p>You'll hear from us either way. In the meantime, if you have questions email us at <a href="mailto:${env.ADMIN_EMAIL}" style="color:#1DB8A0;">${env.ADMIN_EMAIL}</a>.</p>
<p style="color:#4A6670;font-size:13px;">Program dates: 22 June – 29 July 2026 · Demo Day &amp; Gala: 28–29 July 2026</p>
`)
    );
  },

  async sendAcceptanceWithCredentials(opts: {
    to: string; firstName: string; tempPassword: string;
    teamName?: string; functionalRole?: string;
  }): Promise<void> {
    await send(
      opts.to,
      `You're in — Skillyme Africa Cohort 2`,
      base(`
<p>Hi ${opts.firstName},</p>
<p>Congratulations — you've been <strong style="color:${teal};">accepted into ${env.PROGRAM_NAME}</strong>! 🎉</p>
${opts.teamName ? `<p>You've been placed in <strong>${opts.teamName}</strong>${opts.functionalRole ? ` as <em>${opts.functionalRole.replace(/_/g, ' ')}</em>` : ''}.</p>` : ''}
<p>Your login credentials are below. <strong>Please log in and change your password immediately.</strong></p>
<div class="cred-box">
  <p class="label">Platform URL</p>
  <p><a href="${env.FRONTEND_URL}" style="color:#1DB8A0;">${env.FRONTEND_URL}</a></p>
  <p class="label" style="margin-top:12px;">Email</p>
  <p><strong>${opts.to}</strong></p>
  <p class="label" style="margin-top:12px;">Temporary password</p>
  <p><strong>${opts.tempPassword}</strong></p>
</div>
<a href="${env.FRONTEND_URL}/login" class="btn">Log In Now</a>
<p><strong>Next steps:</strong></p>
<ul style="color:#374151;line-height:1.8;padding-left:18px;">
  <li>Log in and complete your profile</li>
  <li>Change your temporary password in Profile → Settings</li>
  <li>Founder Mixer &amp; Team Matching: <strong>18–21 June 2026</strong></li>
  <li>Week 1 kicks off: <strong>Monday 22 June 2026</strong></li>
</ul>
<p style="color:#4A6670;font-size:13px;">This is a temporary password generated for you. Change it after your first login for security.</p>
`)
    );
  },

  async sendInvitation(opts: {
    to: string; firstName: string;
    teamName?: string; functionalRole?: string; token: string;
  }): Promise<void> {
    const link = `${env.FRONTEND_URL}/accept-invite?token=${opts.token}`;
    await send(
      opts.to,
      `You've been invited to ${env.PROGRAM_NAME}`,
      base(`
<p>Hi ${opts.firstName},</p>
<p>You've been invited to join <strong>${env.PROGRAM_NAME}</strong>.</p>
${opts.teamName ? `<p>Team: <strong>${opts.teamName}</strong>${opts.functionalRole ? ` · Role: <strong>${opts.functionalRole.replace(/_/g, ' ')}</strong>` : ''}</p>` : ''}
<p>Click below to set your password and activate your account:</p>
<a href="${link}" class="btn">Activate My Account</a>
<p style="font-size:13px;color:#6B7280;">This link expires in 72 hours.</p>
`)
    );
  },

  async sendWelcome(opts: {
    to: string; firstName: string;
    teamName?: string; functionalRole?: string;
  }): Promise<void> {
    await send(
      opts.to,
      `Welcome to Cohort 2 — you're in.`,
      base(`
<p>Hi ${opts.firstName}, welcome!</p>
<p>Your account is now active. You're officially part of <strong>${env.PROGRAM_NAME}</strong>.</p>
${opts.teamName ? `<p>Team: <strong>${opts.teamName}</strong>${opts.functionalRole ? ` · Role: <strong>${opts.functionalRole.replace(/_/g, ' ')}</strong>` : ''}</p>` : ''}
<a href="${env.FRONTEND_URL}/login" class="btn">Log In to the Platform</a>
`)
    );
  },

  async sendMilestoneReminder(opts: {
    to: string; firstName: string; teamName: string;
    milestoneTitle: string; weekNumber: number; dueDate: Date;
    teamStatus: string; teamId: string;
  }): Promise<void> {
    await send(
      opts.to,
      `Milestone reminder: Week ${opts.weekNumber} due in 48 hours`,
      base(`
<p>Hi ${opts.firstName},</p>
<p>Your <strong>Week ${opts.weekNumber}: ${opts.milestoneTitle}</strong> milestone is due soon.</p>
<p>Team: <strong>${opts.teamName}</strong> · Status: <strong>${opts.teamStatus.replace(/_/g, ' ')}</strong></p>
<a href="${env.FRONTEND_URL}/team" class="btn">View Team Dashboard</a>
`)
    );
  },

  async sendMilestoneApproved(opts: {
    to: string; firstName: string; teamName: string;
    weekNumber: number; milestoneTitle: string;
    facilitatorNote?: string; nextTitle?: string; nextDueDate?: Date;
  }): Promise<void> {
    await send(
      opts.to,
      `✓ Week ${opts.weekNumber} approved — ${opts.teamName}`,
      base(`
<p>Hi ${opts.firstName},</p>
<p>Your <strong>Week ${opts.weekNumber}: ${opts.milestoneTitle}</strong> milestone has been <strong style="color:${teal};">approved!</strong></p>
${opts.facilitatorNote ? `<p><em>Facilitator note:</em> ${opts.facilitatorNote}</p>` : ''}
${opts.nextTitle ? `<p>Up next: <strong>${opts.nextTitle}</strong>${opts.nextDueDate ? ` · Due: ${opts.nextDueDate.toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}` : ''}</p>` : ''}
<a href="${env.FRONTEND_URL}/team" class="btn">View Dashboard</a>
`)
    );
  },

  async sendMilestoneFlagged(opts: {
    to: string; firstName: string; teamName: string;
    weekNumber: number; milestoneTitle: string; facilitatorNote?: string;
  }): Promise<void> {
    await send(
      opts.to,
      `Action needed: Week ${opts.weekNumber} flagged — ${opts.teamName}`,
      base(`
<p>Hi ${opts.firstName},</p>
<p>Your <strong>Week ${opts.weekNumber}: ${opts.milestoneTitle}</strong> milestone has been <strong style="color:#E8341C;">flagged</strong> and needs attention.</p>
${opts.facilitatorNote ? `<p><em>Feedback:</em> ${opts.facilitatorNote}</p>` : ''}
<a href="${env.FRONTEND_URL}/team" class="btn">View Team Dashboard</a>
`)
    );
  },

  async sendSessionReminder(opts: {
    to: string; firstName: string; sessionTitle: string;
    startTime: Date; description?: string;
  }): Promise<void> {
    const timeStr = opts.startTime.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });
    await send(
      opts.to,
      `Session tomorrow: ${opts.sessionTitle}`,
      base(`
<p>Hi ${opts.firstName},</p>
<p>Reminder: <strong>${opts.sessionTitle}</strong> is scheduled for tomorrow at <strong>${timeStr} EAT</strong>.</p>
${opts.description ? `<p>${opts.description}</p>` : ''}
<a href="${env.FRONTEND_URL}/calendar" class="btn">View Calendar</a>
`)
    );
  },

  async sendAnnouncement(opts: {
    to: string; firstName: string; title: string; body: string;
  }): Promise<void> {
    await send(
      opts.to,
      `[Announcement] ${opts.title}`,
      base(`
<p>Hi ${opts.firstName},</p>
<p><strong>${opts.title}</strong></p>
<p>${opts.body.replace(/\n/g, '<br>')}</p>
<a href="${env.FRONTEND_URL}/announcements" class="btn">View on Platform</a>
`)
    );
  },
};
