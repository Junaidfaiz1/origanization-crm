import { LoginForm } from "@/components/auth/auth-forms";
import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata = { title: "Sign in" };

type Props = {
  searchParams: Promise<{ invited?: string; reset?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const notice =
    params.invited === "1"
      ? "Invitation accepted. Sign in with your password."
      : params.reset === "1"
        ? "Password updated. Sign in with your new password."
        : undefined;

  return (
    <AuthPanel
      title="Welcome back"
      description="Sign in to your Technova workspace."
    >
      <LoginForm notice={notice} />
    </AuthPanel>
  );
}
