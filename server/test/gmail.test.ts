import { describe, it, expect } from "vitest";
import { _internals } from "../src/services/gmailData.js";

const { parseFrom, stripHtml, extractBody } = _internals;

describe("parseFrom", () => {
  it("parses name + email and collapses a bulk subdomain to the brand domain", () => {
    const r = parseFrom('"Patagonia" <news@email.patagonia.com>');
    expect(r.name).toBe("Patagonia");
    expect(r.email).toBe("news@email.patagonia.com");
    expect(r.domain).toBe("patagonia.com");
  });

  it("handles a bare address with no display name", () => {
    const r = parseFrom("deals@bar.com");
    expect(r.email).toBe("deals@bar.com");
    expect(r.domain).toBe("bar.com");
  });
});

describe("stripHtml", () => {
  it("removes tags, style and script blocks", () => {
    const out = stripHtml(
      "<style>.a{}</style><script>x()</script><p>Save <b>30%</b> today</p>",
    );
    expect(out).toBe("Save 30% today");
  });
});

describe("extractBody", () => {
  const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");

  it("prefers text/plain", () => {
    const body = extractBody({
      mimeType: "multipart/alternative",
      parts: [
        { mimeType: "text/plain", body: { data: b64("Plain offer text") } },
        { mimeType: "text/html", body: { data: b64("<p>HTML offer</p>") } },
      ],
    });
    expect(body).toBe("Plain offer text");
  });

  it("falls back to stripped HTML when there's no plain part", () => {
    const body = extractBody({
      mimeType: "text/html",
      body: { data: b64("<p>HTML <b>offer</b></p>") },
    });
    expect(body).toBe("HTML offer");
  });
});
