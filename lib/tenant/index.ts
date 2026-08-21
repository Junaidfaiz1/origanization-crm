export function tenantWhere<T extends object>(
  organizationId: string,
  where: T = {} as T,
): T & { organizationId: string } {
  return {
    ...where,
    organizationId,
  };
}

export function assertTenantId(
  recordOrganizationId: string,
  currentOrganizationId: string,
): boolean {
  return recordOrganizationId === currentOrganizationId;
}
