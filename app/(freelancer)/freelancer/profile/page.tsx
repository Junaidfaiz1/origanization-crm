import { requireFreelancerUser } from "@/lib/auth/page";
import { getFreelancerProfile } from "@/modules/freelancer-portal/service";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "My profile" };

export default async function FreelancerProfilePage() {
  const ctx = await requireFreelancerUser();
  const profile = await getFreelancerProfile(ctx);

  if (!profile) {
    return (
      <ErrorState
        title="Resource profile not linked"
        description="Ask the agency to connect your user to a resource profile."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {profile.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your pay rate and skills as shared with the agency. Agency margin is never shown.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pay & availability</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Email: </span>
            {profile.email}
          </p>
          <p>
            <span className="text-muted-foreground">Type: </span>
            {profile.type}
          </p>
          <p>
            <span className="text-muted-foreground">Hourly rate: </span>
            {profile.hourlyRate ? (
              <MoneyDisplay amount={profile.hourlyRate} currency="USD" />
            ) : (
              "—"
            )}
          </p>
          <p>
            <span className="text-muted-foreground">Availability: </span>
            <StatusBadge status={profile.availabilityStatus} />
          </p>
          <p>
            <span className="text-muted-foreground">Experience: </span>
            {profile.experienceYears != null ? `${profile.experienceYears} years` : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Rating: </span>
            {profile.rating ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills listed yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <li
                  key={skill.id}
                  className="rounded-md border border-border px-2.5 py-1 text-sm"
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          )}
          {profile.bio ? (
            <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
              {profile.bio}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
