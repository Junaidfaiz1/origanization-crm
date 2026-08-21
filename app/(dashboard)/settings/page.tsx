import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InviteUserForm,
  MembersTable,
} from "@/components/settings/members-section";
import {
  listAssignableRoles,
  listOrgMembers,
} from "@/modules/users/service";
import { FlashToast } from "@/components/shared/flash-toast";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireDashboardUser();
  const canView = hasPermission(ctx.permissions, "USER_VIEW");
  const canInvite = hasPermission(ctx.permissions, "USER_INVITE");
  const canUpdate = hasPermission(ctx.permissions, "USER_UPDATE");
  const canSuspend = hasPermission(ctx.permissions, "USER_DELETE");

  const [membersResult, roles] = canView
    ? await Promise.all([
        listOrgMembers(
          {
            userId: ctx.userId,
            organizationId: ctx.organizationId,
            roleKey: ctx.roleKey,
          },
          { first: 100 },
        ),
        listAssignableRoles(),
      ])
    : [null, [] as Awaited<ReturnType<typeof listAssignableRoles>>];

  const roleOptions = roles
    .filter((role) => {
      if (role.key === "OWNER") {
        return ctx.roleKey === "OWNER";
      }
      return true;
    })
    .map((role) => ({ key: role.key, name: role.name }));

  const members = membersResult?.edges.map((edge) => edge.node) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <FlashToast />
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Organization profile and member access."
      />

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={ctx.user.organization.name} />
          <Field label="Slug" value={ctx.user.organization.slug} />
          <Field label="Currency" value={ctx.user.organization.currency} />
          <Field label="Your role" value={ctx.user.roleName} />
        </CardContent>
      </Card>

      {canView ? (
        <>
          {canInvite ? (
            <Card>
              <CardHeader>
                <CardTitle>Invite teammate</CardTitle>
              </CardHeader>
              <CardContent>
                <InviteUserForm roles={roleOptions} canInvite={canInvite} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground" role="status">
                  No members found.
                </p>
              ) : (
                <MembersTable
                  members={members}
                  roles={roleOptions}
                  canUpdate={canUpdate}
                  canInvite={canInvite}
                  canSuspend={canSuspend}
                  currentUserId={ctx.userId}
                />
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You need USER_VIEW permission to manage workspace members.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
