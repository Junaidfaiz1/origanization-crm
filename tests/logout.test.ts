import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieSet = vi.fn();
const cookieDelete = vi.fn();
const redirectMock = vi.fn((url: string) => {
  const err = new Error("NEXT_REDIRECT") as Error & { digest: string };
  err.digest = `NEXT_REDIRECT;push;${url}`;
  throw err;
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: cookieSet,
    delete: cookieDelete,
    get: () => undefined,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

vi.mock("@/config/env", () => ({
  getEnv: () => ({ NODE_ENV: "test" }),
}));

describe("logoutAction", () => {
  beforeEach(() => {
    cookieSet.mockClear();
    cookieDelete.mockClear();
    redirectMock.mockClear();
  });

  it("clears the session cookie with matching path then redirects to login", async () => {
    const { logoutAction } = await import("@/modules/auth/actions");

    await expect(logoutAction()).rejects.toMatchObject({
      digest: expect.stringContaining("/login"),
    });

    expect(cookieSet).toHaveBeenCalledWith(
      "tn_session",
      "",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        maxAge: 0,
        sameSite: "lax",
      }),
    );
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
