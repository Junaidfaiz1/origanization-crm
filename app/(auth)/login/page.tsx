import { LoginForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your TechNova workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm notice={notice} />
      </CardContent>
    </Card>
  );
}
