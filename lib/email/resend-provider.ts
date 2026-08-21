import { Resend } from "resend";
import { logger } from "@/lib/logging/logger";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export class ResendEmailProvider {
  private readonly client: Resend;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(payload: EmailPayload): Promise<void> {
    const result = await this.client.emails.send({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (result.error) {
      logger.error("Resend send failed", {
        operation: "email.resend",
        error: result.error,
        to: payload.to,
        subject: payload.subject,
      });
      throw new Error(result.error.message || "Resend failed to send email");
    }

    logger.info("Email sent via Resend", {
      operation: "email.resend",
      to: payload.to,
      subject: payload.subject,
      entityId: result.data?.id,
    });
  }
}
