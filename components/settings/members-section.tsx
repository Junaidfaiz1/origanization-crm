"use client";

import { useActionState } from "react";
import {
  inviteUserAction,
  resendInviteAction,
  suspendMemberAction,
  updateMemberRoleAction,
  type UsersFormState,
} from "@/modules/users/actions";
import type { SerializedOrgMember } from "@/modules/users/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { DateDisplay } from "@/components/shared/date-display";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const initialState: UsersFormState = {};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

type RoleOption = { key: string; name: string };

export function InviteUserForm({
  roles,
  canInvite,
}: {
  roles: RoleOption[];
  canInvite: boolean;
}) {
  const [state, action, pending] = useActionState(inviteUserAction, initialState);

  if (!canInvite) {
    return null;
  }

  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="invite-name">Name</Label>
          <Input id="invite-name" name="name" required />
          <FieldError messages={state.errors?.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" name="email" type="email" required />
          <FieldError messages={state.errors?.email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            name="roleKey"
            required
            className={selectClassName}
            defaultValue="EMPLOYEE"
          >
            {roles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
          <FieldError messages={state.errors?.roleKey} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending invite..." : "Send invite"}
      </Button>
    </form>
  );
}

function MemberRoleForm({
  member,
  roles,
  canUpdate,
}: {
  member: SerializedOrgMember;
  roles: RoleOption[];
  canUpdate: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateMemberRoleAction,
    initialState,
  );

  if (!canUpdate) {
    return <span className="text-sm">{member.role.name}</span>;
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="membershipId" value={member.id} />
      <select
        name="roleKey"
        className={selectClassName}
        defaultValue={member.role.key ?? ""}
        aria-label={`Role for ${member.user.name}`}
      >
        {!roles.some((role) => role.key === member.role.key) && member.role.key ? (
          <option value={member.role.key}>{member.role.name}</option>
        ) : null}
        {roles.map((role) => (
          <option key={role.key} value={role.key}>
            {role.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "..." : "Save"}
      </Button>
      {state.message ? (
        <span className="text-xs text-destructive">{state.message}</span>
      ) : null}
    </form>
  );
}

function MemberActions({
  member,
  canInvite,
  canSuspend,
  currentUserId,
}: {
  member: SerializedOrgMember;
  canInvite: boolean;
  canSuspend: boolean;
  currentUserId: string;
}) {
  const [resendState, resendAction, resendPending] = useActionState(
    resendInviteAction,
    initialState,
  );
  const [suspendState, suspendAction, suspendPending] = useActionState(
    suspendMemberAction,
    initialState,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {member.status === "INVITED" && canInvite ? (
        <form action={resendAction}>
          <input type="hidden" name="membershipId" value={member.id} />
          <Button type="submit" size="sm" variant="ghost" disabled={resendPending}>
            {resendPending ? "Sending..." : "Resend"}
          </Button>
          {resendState.message ? (
            <span className="text-xs text-destructive">{resendState.message}</span>
          ) : null}
        </form>
      ) : null}
      {canSuspend &&
      member.status !== "SUSPENDED" &&
      member.user.id !== currentUserId ? (
        <form action={suspendAction}>
          <input type="hidden" name="membershipId" value={member.id} />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={suspendPending}
            className="text-destructive"
          >
            {suspendPending ? "..." : "Suspend"}
          </Button>
          {suspendState.message ? (
            <span className="text-xs text-destructive">{suspendState.message}</span>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

export function MembersTable({
  members,
  roles,
  canUpdate,
  canInvite,
  canSuspend,
  currentUserId,
}: {
  members: SerializedOrgMember[];
  roles: RoleOption[];
  canUpdate: boolean;
  canInvite: boolean;
  canSuspend: boolean;
  currentUserId: string;
}) {
  const columns: DataTableColumn<SerializedOrgMember>[] = [
    {
      id: "user",
      header: "Member",
      cell: (member) => (
        <>
          <p className="font-medium">{member.user.name}</p>
          <p className="text-xs text-muted-foreground">{member.user.email}</p>
        </>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (member) => <StatusBadge status={member.status} />,
    },
    {
      id: "role",
      header: "Role",
      cell: (member) => (
        <MemberRoleForm member={member} roles={roles} canUpdate={canUpdate} />
      ),
    },
    {
      id: "joined",
      header: "Joined",
      className: "text-muted-foreground",
      cell: (member) => <DateDisplay value={member.joinedAt} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (member) => (
        <MemberActions
          member={member}
          canInvite={canInvite}
          canSuspend={canSuspend}
          currentUserId={currentUserId}
        />
      ),
    },
  ];

  return (
    <DataTable
      rows={members}
      columns={columns}
      rowKey={(member) => member.id}
      caption="Workspace members"
      mobileRow={(member) => (
        <div className="space-y-2 rounded-md border p-3">
          <div>
            <p className="font-medium">{member.user.name}</p>
            <p className="text-xs text-muted-foreground">{member.user.email}</p>
          </div>
          <StatusBadge status={member.status} />
          <MemberRoleForm member={member} roles={roles} canUpdate={canUpdate} />
          <MemberActions
            member={member}
            canInvite={canInvite}
            canSuspend={canSuspend}
            currentUserId={currentUserId}
          />
        </div>
      )}
    />
  );
}
