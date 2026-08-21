import { getEnv } from "@/config/env";
import { logger } from "@/lib/logging/logger";
import { ResendEmailProvider } from "@/lib/email/resend-provider";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}

export class ConsoleEmailProvider implements EmailProvider {
  async send(payload: EmailPayload): Promise<void> {
    logger.info("Email skipped (no Resend API key)", {
      operation: "email.console",
      to: payload.to,
      subject: payload.subject,
    });
  }
}

export function createEmailProvider(config: {
  resendApiKey?: string;
  emailFrom?: string;
}): EmailProvider {
  const apiKey = config.resendApiKey?.trim() ?? "";
  if (!apiKey) {
    return new ConsoleEmailProvider();
  }

  const from =
    config.emailFrom?.trim() || "TechNova CRM <onboarding@resend.dev>";
  return new ResendEmailProvider(apiKey, from);
}

let provider: EmailProvider | null = null;
let providerOverride: EmailProvider | null = null;

function resolveProvider(): EmailProvider {
  if (providerOverride) {
    return providerOverride;
  }
  if (provider) {
    return provider;
  }

  try {
    const env = getEnv();
    provider = createEmailProvider({
      resendApiKey: env.RESEND_API_KEY,
      emailFrom: env.EMAIL_FROM,
    });
  } catch {
    provider = new ConsoleEmailProvider();
  }

  return provider;
}

/** Test / bootstrap helper — swaps the active provider. */
export function setEmailProvider(next: EmailProvider) {
  providerOverride = next;
}

export function resetEmailProvider() {
  provider = null;
  providerOverride = null;
}

export function getActiveEmailProviderName(): "resend" | "console" {
  const active = resolveProvider();
  return active instanceof ResendEmailProvider ? "resend" : "console";
}

async function sendSafe(payload: EmailPayload): Promise<void> {
  try {
    await resolveProvider().send(payload);
  } catch (error) {
    logger.error("Email send failed", {
      operation: "email.send",
      error,
      to: payload.to,
      subject: payload.subject,
    });
  }
}

export const emailService = {
  async sendWelcomeEmail(to: string, name: string) {
    await sendSafe({
      to,
      subject: "Welcome to TechNova CRM",
      html: `<p>Hi ${escapeHtml(name)},</p><p>Your workspace is ready.</p>`,
      text: `Hi ${name}, your workspace is ready.`,
    });
  },
  async sendProposalEmail(to: string, title: string) {
    await sendSafe({
      to,
      subject: `Proposal: ${title}`,
      html: `<p>A proposal is ready for your review: <strong>${escapeHtml(title)}</strong></p>`,
      text: `A proposal is ready for your review: ${title}`,
    });
  },
  async sendBidNotification(to: string, title: string) {
    await sendSafe({
      to,
      subject: `New bid on ${title}`,
      html: `<p>A new bid was submitted for <strong>${escapeHtml(title)}</strong>.</p>`,
      text: `A new bid was submitted for ${title}.`,
    });
  },
  async sendBidAccepted(to: string, title: string) {
    await sendSafe({
      to,
      subject: `Bid accepted: ${title}`,
      html: `<p>Your bid for <strong>${escapeHtml(title)}</strong> was accepted.</p>`,
      text: `Your bid for ${title} was accepted.`,
    });
  },
  async sendBidRejected(to: string, title: string) {
    await sendSafe({
      to,
      subject: `Bid update: ${title}`,
      html: `<p>Your bid for <strong>${escapeHtml(title)}</strong> was not selected.</p>`,
      text: `Your bid for ${title} was not selected.`,
    });
  },
  async sendInvoiceEmail(to: string, invoiceNumber: string) {
    await sendSafe({
      to,
      subject: `Invoice ${invoiceNumber}`,
      html: `<p>Invoice <strong>${escapeHtml(invoiceNumber)}</strong> is ready.</p>`,
      text: `Invoice ${invoiceNumber} is ready.`,
    });
  },
  async sendPaymentReceipt(to: string, invoiceNumber: string) {
    await sendSafe({
      to,
      subject: `Payment received for ${invoiceNumber}`,
      html: `<p>We received your payment for invoice <strong>${escapeHtml(invoiceNumber)}</strong>.</p>`,
      text: `We received your payment for invoice ${invoiceNumber}.`,
    });
  },
  async sendPaymentReminder(to: string, invoiceNumber: string) {
    await sendSafe({
      to,
      subject: `Reminder: invoice ${invoiceNumber} is due`,
      html: `<p>Invoice <strong>${escapeHtml(invoiceNumber)}</strong> is outstanding.</p>`,
      text: `Invoice ${invoiceNumber} is outstanding.`,
    });
  },
  async sendInviteEmail(
    to: string,
    input: {
      name: string;
      organizationName: string;
      inviteUrl: string;
      roleName: string;
    },
  ) {
    await sendSafe({
      to,
      subject: `You're invited to ${input.organizationName}`,
      html: `<p>Hi ${escapeHtml(input.name)},</p>
<p>You have been invited to join <strong>${escapeHtml(input.organizationName)}</strong> as <strong>${escapeHtml(input.roleName)}</strong>.</p>
<p><a href="${escapeHtml(input.inviteUrl)}">Accept invitation</a></p>`,
      text: `Hi ${input.name}, you are invited to ${input.organizationName} as ${input.roleName}. Accept: ${input.inviteUrl}`,
    });
  },
  async sendPasswordResetEmail(
    to: string,
    input: { name: string; resetUrl: string },
  ) {
    await sendSafe({
      to,
      subject: "Reset your TechNova CRM password",
      html: `<p>Hi ${escapeHtml(input.name)},</p>
<p>We received a request to reset your password.</p>
<p><a href="${escapeHtml(input.resetUrl)}">Reset password</a></p>
<p>If you did not request this, you can ignore this email.</p>`,
      text: `Hi ${input.name}, reset your password: ${input.resetUrl}`,
    });
  },
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
