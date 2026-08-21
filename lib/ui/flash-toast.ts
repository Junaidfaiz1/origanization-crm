export const FLASH_TOAST_MESSAGES = {
  saved: "Changes saved",
  created: "Created successfully",
  updated: "Updated successfully",
  deleted: "Deleted successfully",
  archived: "Archived successfully",
  converted: "Converted successfully",
  assigned: "Assigned successfully",
  uploaded: "Uploaded successfully",
  sent: "Sent successfully",
  invited: "Invite sent",
} as const;

export type FlashToastKey = keyof typeof FLASH_TOAST_MESSAGES;

export function isFlashToastKey(value: string | null | undefined): value is FlashToastKey {
  return Boolean(value && value in FLASH_TOAST_MESSAGES);
}

export function withFlashToast(path: string, toast: FlashToastKey): string {
  const url = new URL(path, "http://local.invalid");
  url.searchParams.set("toast", toast);
  return `${url.pathname}${url.search}${url.hash}`;
}
