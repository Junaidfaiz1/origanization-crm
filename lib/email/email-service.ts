type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(payload: EmailPayload): Promise<void> {
    console.info(
      JSON.stringify({
        level: "info",
        message: "Email skipped (no provider configured)",
        to: payload.to,
        subject: payload.subject,
      }),
    );
  }
}

let provider: EmailProvider = new ConsoleEmailProvider();

export function setEmailProvider(next: EmailProvider) {
  provider = next;
}

export const emailService = {
  async sendWelcomeEmail(to: string, name: string) {
    await provider.send({
      to,
      subject: "Welcome to TechNova CRM",
      html: `<p>Hi ${name},</p><p>Your workspace is ready.</p>`,
      text: `Hi ${name}, your workspace is ready.`,
    });
  },
  async sendProposalEmail(to: string, title: string) {
    await provider.send({
      to,
      subject: `Proposal: ${title}`,
      html: `<p>A proposal is ready for your review: ${title}</p>`,
    });
  },
  async sendBidNotification(to: string, title: string) {
    await provider.send({
      to,
      subject: `New bid on ${title}`,
      html: `<p>A new bid was submitted for ${title}.</p>`,
    });
  },
  async sendBidAccepted(to: string, title: string) {
    await provider.send({
      to,
      subject: `Bid accepted: ${title}`,
      html: `<p>Your bid for ${title} was accepted.</p>`,
    });
  },
  async sendBidRejected(to: string, title: string) {
    await provider.send({
      to,
      subject: `Bid update: ${title}`,
      html: `<p>Your bid for ${title} was not selected.</p>`,
    });
  },
  async sendInvoiceEmail(to: string, invoiceNumber: string) {
    await provider.send({
      to,
      subject: `Invoice ${invoiceNumber}`,
      html: `<p>Invoice ${invoiceNumber} is ready.</p>`,
    });
  },
  async sendPaymentReceipt(to: string, invoiceNumber: string) {
    await provider.send({
      to,
      subject: `Payment received for ${invoiceNumber}`,
      html: `<p>We received your payment for invoice ${invoiceNumber}.</p>`,
    });
  },
  async sendPaymentReminder(to: string, invoiceNumber: string) {
    await provider.send({
      to,
      subject: `Reminder: invoice ${invoiceNumber} is due`,
      html: `<p>Invoice ${invoiceNumber} is outstanding.</p>`,
    });
  },
};
