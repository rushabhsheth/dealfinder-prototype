import { describe, it, expect } from "vitest";
import { assertReadOnlyScopes, GMAIL_READONLY } from "../src/services/google.js";

describe("assertReadOnlyScopes (hard rule: read-only only)", () => {
  it("accepts a read-only grant", () => {
    const granted = assertReadOnlyScopes(`openid email ${GMAIL_READONLY}`);
    expect(granted).toContain(GMAIL_READONLY);
  });

  it("rejects any write-capable scope", () => {
    expect(() =>
      assertReadOnlyScopes(
        `${GMAIL_READONLY} https://www.googleapis.com/auth/gmail.modify`,
      ),
    ).toThrow(/write-capable/i);
  });

  it("rejects full-mailbox access", () => {
    expect(() =>
      assertReadOnlyScopes("https://mail.google.com/"),
    ).toThrow();
  });

  it("rejects a grant missing the read scope", () => {
    expect(() => assertReadOnlyScopes("openid email")).toThrow(/gmail.readonly/i);
  });
});
