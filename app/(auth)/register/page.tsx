import { RegisterForm } from "@/components/auth/auth-forms";
import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata = { title: "Create workspace" };

export default function RegisterPage() {
  return (
    <AuthPanel
      title="Create your workspace"
      description="Register as owner and start with a dedicated organization."
    >
      <RegisterForm />
    </AuthPanel>
  );
}
