import { getEnv } from "@/config/env";
import { R2StorageProvider } from "@/lib/storage/r2-provider";

export type UploadInput = {
  key: string;
  body: Buffer | Uint8Array;
  mimeType: string;
};

export interface StorageService {
  upload(input: UploadInput): Promise<void>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  exists(key: string): Promise<boolean>;
  getObject(key: string): Promise<Buffer>;
}

class UnconfiguredStorage implements StorageService {
  async upload(): Promise<void> {
    throw new Error("Storage is not configured. Set Cloudflare R2 credentials.");
  }
  async delete(): Promise<void> {
    throw new Error("Storage is not configured. Set Cloudflare R2 credentials.");
  }
  async getSignedUrl(): Promise<string> {
    throw new Error("Storage is not configured. Set Cloudflare R2 credentials.");
  }
  async exists(): Promise<boolean> {
    return false;
  }
  async getObject(): Promise<Buffer> {
    throw new Error("Storage is not configured. Set Cloudflare R2 credentials.");
  }
}

export function createStorageProvider(config: {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
}): StorageService {
  const accountId = config.accountId?.trim() ?? "";
  const accessKeyId = config.accessKeyId?.trim() ?? "";
  const secretAccessKey = config.secretAccessKey?.trim() ?? "";
  const bucketName = config.bucketName?.trim() ?? "";

  if (accountId && accessKeyId && secretAccessKey && bucketName) {
    return new R2StorageProvider({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
    });
  }

  return new UnconfiguredStorage();
}

let storage: StorageService | null = null;
let storageOverride: StorageService | null = null;

function resolveStorage(): StorageService {
  if (storageOverride) {
    return storageOverride;
  }
  if (storage) {
    return storage;
  }

  try {
    const env = getEnv();
    storage = createStorageProvider({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucketName: env.R2_BUCKET_NAME,
    });
  } catch {
    storage = new UnconfiguredStorage();
  }

  return storage;
}

export function setStorageService(next: StorageService) {
  storageOverride = next;
}

export function resetStorageService() {
  storage = null;
  storageOverride = null;
}

export function getStorageService(): StorageService {
  return resolveStorage();
}

export function isR2StorageConfigured(): boolean {
  return resolveStorage() instanceof R2StorageProvider;
}
