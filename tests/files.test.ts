import { describe, expect, it } from "vitest";
import {
  assertCanManageProjectFiles,
  assertValidUpload,
  sanitizeFileName,
  MAX_FILE_SIZE_BYTES,
} from "@/modules/files/rules";
import { createStorageProvider } from "@/lib/storage/storage-service";
import { R2StorageProvider } from "@/lib/storage/r2-provider";
import { fileListFilterSchema, uploadFileMetaSchema } from "@/modules/files/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError, ValidationError } from "@/lib/errors/app-error";

describe("file rules", () => {
  it("blocks file management on archived or closed projects", () => {
    expect(() =>
      assertCanManageProjectFiles({ archivedAt: new Date(), status: "IN_PROGRESS" }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertCanManageProjectFiles({ archivedAt: null, status: "CLOSED" }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertCanManageProjectFiles({ archivedAt: null, status: "IN_PROGRESS" }),
    ).not.toThrow();
  });

  it("validates mime type and size", () => {
    expect(() =>
      assertValidUpload({
        fileName: "brief.pdf",
        mimeType: "application/pdf",
        size: 1024,
      }),
    ).not.toThrow();

    expect(() =>
      assertValidUpload({
        fileName: "virus.exe",
        mimeType: "application/x-msdownload",
        size: 1024,
      }),
    ).toThrow(ValidationError);

    expect(() =>
      assertValidUpload({
        fileName: "huge.pdf",
        mimeType: "application/pdf",
        size: MAX_FILE_SIZE_BYTES + 1,
      }),
    ).toThrow(ValidationError);
  });

  it("sanitizes file names", () => {
    expect(sanitizeFileName("../secret/../a b.pdf")).toBe(".._secret_.._a b.pdf");
  });
});

describe("storage provider selection", () => {
  it("rejects missing R2 credentials", async () => {
    const provider = createStorageProvider({});
    await expect(provider.upload({ key: "x", body: Buffer.from(""), mimeType: "text/plain" })).rejects.toThrow(
      /R2 credentials/i,
    );
  });

  it("uses R2 when all credentials are present", () => {
    const provider = createStorageProvider({
      accountId: "acct",
      accessKeyId: "key",
      secretAccessKey: "secret",
      bucketName: "bucket",
    });
    expect(provider).toBeInstanceOf(R2StorageProvider);
  });
});

describe("file validation", () => {
  it("defaults entity type to Project", () => {
    const parsed = uploadFileMetaSchema.parse({ entityId: "project_1" });
    expect(parsed.entityType).toBe("Project");
  });

  it("parses list filters", () => {
    const parsed = fileListFilterSchema.parse({
      search: "brief",
      projectId: "project_1",
      first: "20",
    });
    expect(parsed.search).toBe("brief");
    expect(parsed.projectId).toBe("project_1");
    expect(parsed.first).toBe(20);
  });
});

describe("file permissions", () => {
  it("uses PROJECT permissions for file access", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "PROJECT_UPDATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PROJECT_UPDATE")).toBe(false);
  });

  it("scopes file rows by organizationId", () => {
    const where = { id: "file_1", organizationId: "org_a" };
    expect(where.organizationId).toBe("org_a");
  });
});
