export function homePathForRole(roleKey: string | undefined): string {
  if (roleKey === "CLIENT") {
    return "/portal";
  }
  if (roleKey === "FREELANCER") {
    return "/freelancer";
  }
  return "/dashboard";
}
