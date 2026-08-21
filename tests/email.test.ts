import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ConsoleEmailProvider,
  createEmailProvider,
  emailService,
  resetEmailProvider,
  setEmailProvider,
} from "@/lib/email/email-service";
import { ResendEmailProvider } from "@/lib/email/resend-provider";

afterEach(() => {
  resetEmailProvider();
});

describe("createEmailProvider", () => {
  it("uses console when API key is missing", () => {
    const provider = createEmailProvider({ resendApiKey: "" });
    expect(provider).toBeInstanceOf(ConsoleEmailProvider);
  });

  it("uses Resend when API key is present", () => {
    const provider = createEmailProvider({
      resendApiKey: "re_test_key",
      emailFrom: "TechNova <noreply@example.com>",
    });
    expect(provider).toBeInstanceOf(ResendEmailProvider);
  });
});

describe("emailService", () => {
  it("delegates welcome email to the active provider", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    setEmailProvider({ send });

    await emailService.sendWelcomeEmail("owner@example.com", "Ada");

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        subject: "Welcome to TechNova CRM",
      }),
    );
    expect(String(send.mock.calls[0][0].html)).toContain("Ada");
  });

  it("escapes HTML in proposal titles", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    setEmailProvider({ send });

    await emailService.sendProposalEmail("client@example.com", `<script>x</script>`);

    expect(String(send.mock.calls[0][0].html)).not.toContain("<script>");
    expect(String(send.mock.calls[0][0].html)).toContain("&lt;script&gt;");
  });

  it("sends invite and password-reset emails", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    setEmailProvider({ send });

    await emailService.sendInviteEmail("new@example.com", {
      name: "New User",
      organizationName: "Acme",
      inviteUrl: "http://localhost:3000/reset-password?token=abc",
      roleName: "Employee",
    });
    await emailService.sendPasswordResetEmail("user@example.com", {
      name: "Ada",
      resetUrl: "http://localhost:3000/reset-password?token=xyz",
    });

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0].subject).toContain("Acme");
    expect(send.mock.calls[1][0].subject).toContain("Reset");
  });

  it("swallows provider errors so domain flows stay best-effort", async () => {
    setEmailProvider({
      send: vi.fn().mockRejectedValue(new Error("network down")),
    });

    await expect(
      emailService.sendInvoiceEmail("client@example.com", "INV-1"),
    ).resolves.toBeUndefined();
  });
});
