import { describe, it, expect, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import {
  extractOffers,
  parseOffersFromResponse,
} from "../src/services/extraction.js";
import type { ParsedMessage } from "../src/services/provider.js";

const msg: ParsedMessage = {
  messageId: "m1",
  fromName: "Patagonia",
  fromEmail: "news@email.patagonia.com",
  fromDomain: "patagonia.com",
  subject: "30% off jackets",
  snippet: "Save now",
  bodyText: "Take 30% off all jackets with code WARM30. Ends June 30.",
  listUnsubscribe: null,
  oneClickUnsubscribe: false,
  date: "2026-06-20T00:00:00Z",
};

function messageWith(input: unknown): Anthropic.Message {
  return {
    content: [{ type: "tool_use", name: "record_offers", id: "t1", input }],
  } as unknown as Anthropic.Message;
}

describe("parseOffersFromResponse", () => {
  it("extracts and applies schema defaults", () => {
    const offers = parseOffersFromResponse(
      messageWith({
        offers: [{ category: "retail", title: "30% off jackets", redeemType: "code" }],
      }),
    );
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      category: "retail",
      title: "30% off jackets",
      redeemType: "code",
      subtitle: "", // default
      savingsAmount: 0, // default
      code: null, // default
    });
  });

  it("returns [] when no tool_use block is present", () => {
    const text = { content: [{ type: "text", text: "no offers" }] } as unknown as Anthropic.Message;
    expect(parseOffersFromResponse(text)).toEqual([]);
  });

  it("returns [] on a schema-invalid tool input (bad category)", () => {
    const offers = parseOffersFromResponse(
      messageWith({ offers: [{ category: "nope", title: "x", redeemType: "code" }] }),
    );
    expect(offers).toEqual([]);
  });

  it("passes through an explicitly empty offers array", () => {
    expect(parseOffersFromResponse(messageWith({ offers: [] }))).toEqual([]);
  });
});

describe("extractOffers (with injected client)", () => {
  it("forces the record_offers tool and returns parsed offers", async () => {
    const create = vi.fn().mockResolvedValue(
      messageWith({
        offers: [
          {
            category: "retail",
            title: "30% off jackets",
            savingsPercent: 30,
            code: "WARM30",
            redeemType: "code",
          },
        ],
      }),
    );
    const fakeClient = { messages: { create } } as unknown as Anthropic;

    const offers = await extractOffers(msg, { client: fakeClient, model: "test-model" });

    expect(offers).toHaveLength(1);
    expect(offers[0]!.code).toBe("WARM30");
    const callArg = create.mock.calls[0]![0];
    expect(callArg.model).toBe("test-model");
    expect(callArg.tool_choice).toEqual({ type: "tool", name: "record_offers" });
  });
});
