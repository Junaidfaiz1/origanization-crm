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
}

let storage: StorageService = new UnconfiguredStorage();

export function setStorageService(next: StorageService) {
  storage = next;
}

export function getStorageService(): StorageService {
  return storage;
}
