import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthPanel
      title="Reset your password"
      description="Enter your email and we will send reset instructions if an account exists."
    >
      <ForgotPasswordForm />
    </AuthPanel>
  );
}
