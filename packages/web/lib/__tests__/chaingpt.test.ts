import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  askChainGPT,
  auditContract,
  checkFairPrice,
  getMarketSignal,
  checkCompliance,
  generateSettlementReport,
  generateNftReceipt,
  parseFencedJson,
} from "../chaingpt";

const ORIGINAL_API_KEY = process.env.CHAINGPT_API_KEY;

beforeEach(() => {
  process.env.CHAINGPT_API_KEY = "test-key";
  vi.restoreAllMocks();
});

afterEach(() => {
  if (ORIGINAL_API_KEY === undefined) {
    delete process.env.CHAINGPT_API_KEY;
  } else {
    process.env.CHAINGPT_API_KEY = ORIGINAL_API_KEY;
  }
});

function mockFetchOk(body: string | Record<string, unknown>) {
  const isJson = typeof body !== "string";
  return vi.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => (isJson ? JSON.stringify(body) : (body as string)),
    json: async () => body as Record<string, unknown>,
  } as never);
}

function mockFetchError(status: number, errText: string) {
  return vi.spyOn(global, "fetch").mockResolvedValue({
    ok: false,
    status,
    text: async () => errText,
  } as never);
}

/* -------------------------------------------------------------------------- */
/*                              parseFencedJson                               */
/* -------------------------------------------------------------------------- */

describe("parseFencedJson", () => {
  describe("positive cases", () => {
    test("parses fenced ```json block", () => {
      const result = parseFencedJson<{ a: number }>('```json\n{"a": 1}\n```');
      expect(result).toEqual({ a: 1 });
    });

    test("parses bare JSON without fences", () => {
      const result = parseFencedJson<{ x: string }>('{"x": "hello"}');
      expect(result).toEqual({ x: "hello" });
    });

    test("strips trailing fence on plain ``` close", () => {
      const result = parseFencedJson<{ ok: boolean }>('{"ok": true}\n```');
      expect(result).toEqual({ ok: true });
    });
  });

  describe("negative cases", () => {
    test("returns null when no JSON object present", () => {
      expect(parseFencedJson("just text, no braces")).toBeNull();
    });

    test("returns null when JSON.parse throws on matched but invalid content", () => {
      expect(parseFencedJson("{not valid json}")).toBeNull();
    });

    test("returns null on empty string", () => {
      expect(parseFencedJson("")).toBeNull();
    });
  });

  describe("edge cases", () => {
    test("matches first JSON object when multiple are present (lazy regex)", () => {
      const result = parseFencedJson<{ first: number }>('{"first": 1} {"second": 2}');
      expect(result).toEqual({ first: 1 });
    });

    test("handles whitespace-only input", () => {
      expect(parseFencedJson("   \n\n   ")).toBeNull();
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                                askChainGPT                                 */
/* -------------------------------------------------------------------------- */

describe("askChainGPT", () => {
  describe("positive cases", () => {
    test("posts to /chat/stream with bearer auth and model+question body", async () => {
      const fetchSpy = mockFetchOk("response text");
      const result = await askChainGPT({
        model: "general_assistant",
        question: "hello",
      });

      expect(result).toBe("response text");
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.chaingpt.org/chat/stream",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-key",
          }),
        }),
      );
      const body = JSON.parse(
        (fetchSpy.mock.calls[0][1] as { body: string }).body,
      );
      expect(body).toEqual({
        model: "general_assistant",
        question: "hello",
        chatHistory: "off",
      });
    });
  });

  describe("negative cases", () => {
    test("throws if CHAINGPT_API_KEY is missing", async () => {
      delete process.env.CHAINGPT_API_KEY;
      await expect(
        askChainGPT({ model: "general_assistant", question: "x" }),
      ).rejects.toThrow("CHAINGPT_API_KEY not set");
    });

    test("throws on non-OK HTTP status with truncated body", async () => {
      mockFetchError(503, "long error text ".repeat(50));
      await expect(
        askChainGPT({ model: "general_assistant", question: "x" }),
      ).rejects.toThrow(/ChainGPT 503/);
    });
  });

  describe("edge cases", () => {
    test("truncates 4xx error text to 200 chars in thrown message", async () => {
      const long = "x".repeat(500);
      mockFetchError(400, long);
      try {
        await askChainGPT({ model: "general_assistant", question: "x" });
        expect.fail("should have thrown");
      } catch (e: unknown) {
        const msg = (e as Error).message;
        expect(msg).toContain("ChainGPT 400");
        // Body slice is bounded
        expect(msg.length).toBeLessThan(250);
      }
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                              auditContract                                 */
/* -------------------------------------------------------------------------- */

describe("auditContract", () => {
  describe("positive cases", () => {
    test("parses numbered findings and returns 'low' risk with no warning words", async () => {
      mockFetchOk(`Audit complete.

1. **Style note** — minor
2. **Naming** — could improve

Overall: clean.`);
      const r = await auditContract("contract X {}");
      expect(r.findings).toEqual(["Style note", "Naming"]);
      expect(r.riskLevel).toBe("low");
      expect(r.raw).toContain("Audit complete");
    });

    test("classifies as 'high' when 'critical' appears", async () => {
      mockFetchOk("CRITICAL: reentrancy risk.\n1. **Reentrancy**: bad");
      const r = await auditContract("contract Y {}");
      expect(r.riskLevel).toBe("high");
    });

    test("classifies as 'medium' when warning keyword present", async () => {
      mockFetchOk("Warning: gas issue.\n1. **Gas**: high cost");
      const r = await auditContract("contract Z {}");
      expect(r.riskLevel).toBe("medium");
    });

    test("classifies as 'medium' when vulnerab- keyword present", async () => {
      mockFetchOk("Possible vulnerability identified.");
      const r = await auditContract("contract V {}");
      expect(r.riskLevel).toBe("medium");
    });

    test("classifies as 'medium' when >=3 findings even if no risk words", async () => {
      mockFetchOk(`Notes:
1. **A**
2. **B**
3. **C**`);
      const r = await auditContract("contract M {}");
      expect(r.findings).toHaveLength(3);
      expect(r.riskLevel).toBe("medium");
    });
  });

  describe("negative cases", () => {
    test("propagates fetch failure", async () => {
      mockFetchError(500, "down");
      await expect(auditContract("c")).rejects.toThrow(/ChainGPT 500/);
    });
  });

  describe("edge cases", () => {
    test("returns empty findings when raw has no numbered bold patterns", async () => {
      mockFetchOk("Plain text response with no numbered findings.");
      const r = await auditContract("c");
      expect(r.findings).toEqual([]);
      expect(r.riskLevel).toBe("low");
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                              checkFairPrice                                */
/* -------------------------------------------------------------------------- */

describe("checkFairPrice", () => {
  describe("positive cases", () => {
    test("parses fenced JSON and computes deltaBps via safeDeltaBps", async () => {
      mockFetchOk('```json\n{"fairPriceUsd": 3500, "rationale": "current ETH"}\n```');
      const r = await checkFairPrice("ETH/USDC", 3500);
      expect(r.fairPriceUsd).toBe(3500);
      expect(r.yourPriceUsd).toBe(3500);
      expect(r.deltaBps).toBe(0);
      expect(r.rationale).toBe("current ETH");
      expect(r.warning).toBeUndefined();
    });

    test("attaches warning when deltaBps exceeds ±500", async () => {
      mockFetchOk('{"fairPriceUsd": 3500, "rationale": "stale"}');
      const r = await checkFairPrice("ETH/USDC", 4000);
      expect(r.deltaBps).toBeGreaterThan(500);
      expect(r.warning).toMatch(/% off market/);
    });

    test("parses bare-JSON response (no fences)", async () => {
      mockFetchOk('{"fairPriceUsd": 100, "rationale": "test"}');
      const r = await checkFairPrice("FOO/BAR", 100);
      expect(r.fairPriceUsd).toBe(100);
    });
  });

  describe("negative cases", () => {
    test("falls back to yourPriceUsd when JSON cannot be parsed", async () => {
      mockFetchOk("totally not json");
      const r = await checkFairPrice("ETH/USDC", 3500);
      expect(r.fairPriceUsd).toBe(3500);
      expect(r.rationale).toContain("unavailable");
      expect(r.deltaBps).toBe(0);
    });

    test("falls back when JSON.parse throws (matched but unparseable)", async () => {
      // The regex /\{[\s\S]*?\}/ matches "{not valid}", but JSON.parse rejects it.
      mockFetchOk("{not valid json at all}");
      const r = await checkFairPrice("ETH/USDC", 3500);
      expect(r.fairPriceUsd).toBe(3500);
      expect(r.rationale).toContain("unavailable");
    });

    test("ignores non-numeric fairPriceUsd in payload (retries then falls back)", async () => {
      mockFetchOk('{"fairPriceUsd": "not-a-number", "rationale": "ok"}');
      const r = await checkFairPrice("ETH/USDC", 3500);
      expect(r.fairPriceUsd).toBe(3500); // fallback to yourPriceUsd after both retries fail validation
      expect(r.rationale).toContain("unavailable");
    });

    test("ignores zero / negative fairPriceUsd (retries then falls back)", async () => {
      mockFetchOk('{"fairPriceUsd": 0, "rationale": "ok"}');
      const r = await checkFairPrice("ETH/USDC", 3500);
      expect(r.fairPriceUsd).toBe(3500); // fallback because 0 is not > 0
      expect(r.rationale).toContain("unavailable");
    });
  });

  describe("edge cases", () => {
    test("uses default rationale when payload has no rationale field but valid price", async () => {
      mockFetchOk('{"fairPriceUsd": 3500}');
      const r = await checkFairPrice("ETH/USDC", 3500);
      expect(r.fairPriceUsd).toBe(3500);
      expect(r.rationale).toContain("market price");
    });

    test("strips c-prefix from confidential token symbols in normalized pair", async () => {
      mockFetchOk('{"fairPriceUsd": 3500, "rationale": "spot price"}');
      const r = await checkFairPrice("cETH/cUSDC", 3500);
      expect(r.fairPriceUsd).toBe(3500);
      // pair return value preserves original input (UI shows what user gave)
      expect(r.pair).toBe("cETH/cUSDC");
    });

    test("warning fires at exactly 501 bps (just above threshold)", async () => {
      // your=100, fair=95 → delta = 5/95*10000 = 526 bps
      mockFetchOk('{"fairPriceUsd": 95, "rationale": "x"}');
      const r = await checkFairPrice("FOO/BAR", 100);
      expect(r.deltaBps).toBeGreaterThan(500);
      expect(r.warning).toBeDefined();
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                              getMarketSignal                               */
/* -------------------------------------------------------------------------- */

describe("getMarketSignal", () => {
  describe("positive cases", () => {
    test("parses fenced JSON bias/confidence/rationale", async () => {
      mockFetchOk('```json\n{"bias":"bullish","confidence":"high","rationale":"strong inflow"}\n```');
      const s = await getMarketSignal("ETH/USDC");
      expect(s.bias).toBe("bullish");
      expect(s.confidence).toBe("high");
      expect(s.rationale).toBe("strong inflow");
    });

    test("parses bare JSON without fences", async () => {
      mockFetchOk('{"bias":"bearish","confidence":"low","rationale":"neutral macro"}');
      const s = await getMarketSignal("BTC/USDT");
      expect(s.bias).toBe("bearish");
      expect(s.confidence).toBe("low");
    });
  });

  describe("negative cases", () => {
    test("falls back to neutral/low when JSON unparseable", async () => {
      mockFetchOk("not-json");
      const s = await getMarketSignal("ETH/USDC");
      expect(s.bias).toBe("neutral");
      expect(s.confidence).toBe("low");
      expect(s.rationale).toContain("could not be parsed");
    });

    test("falls back when malformed JSON throws inside try", async () => {
      mockFetchOk("{not really }");
      const s = await getMarketSignal("ETH/USDC");
      expect(s.bias).toBe("neutral");
    });
  });

  describe("edge cases", () => {
    test("uses defaults when only rationale missing", async () => {
      mockFetchOk('{"bias":"bullish","confidence":"medium"}');
      const s = await getMarketSignal("ETH/USDC");
      expect(s.bias).toBe("bullish");
      expect(s.confidence).toBe("medium");
      expect(s.rationale).toContain("could not be parsed");
    });

    test("partial payload — only bias present, rest defaults", async () => {
      mockFetchOk('{"bias":"bullish"}');
      const s = await getMarketSignal("ETH/USDC");
      expect(s.bias).toBe("bullish");
      expect(s.confidence).toBe("low");
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                              checkCompliance                               */
/* -------------------------------------------------------------------------- */

describe("checkCompliance", () => {
  describe("positive cases", () => {
    test("extracts up to 5 numbered flags", async () => {
      mockFetchOk(`Brief overview.

1. **KYC required** for both parties.
2. **AML monitoring** active.
3. **Securities compliance** depends on token classification.`);
      const r = await checkCompliance("ETH/USDC", "EU");
      expect(r.flags).toEqual([
        "KYC required",
        "AML monitoring",
        "Securities compliance",
      ]);
    });

    test("caps flag list at 5 even if more numbered points present", async () => {
      mockFetchOk(`1. **A**
2. **B**
3. **C**
4. **D**
5. **E**
6. **F**
7. **G**`);
      const r = await checkCompliance("ETH/USDC", "US");
      expect(r.flags).toHaveLength(5);
    });
  });

  describe("edge cases", () => {
    test("returns empty flags when raw has no numbered patterns", async () => {
      mockFetchOk("Compliance is straightforward — no flags.");
      const r = await checkCompliance("ETH/USDC", "EU");
      expect(r.flags).toEqual([]);
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                          generateSettlementReport                          */
/* -------------------------------------------------------------------------- */

describe("generateSettlementReport", () => {
  describe("positive cases", () => {
    test("returns plain text from ChainGPT and includes all ctx fields in prompt", async () => {
      const fetchSpy = mockFetchOk("Audit-friendly report text.");
      const result = await generateSettlementReport({
        txHash: "0xABCD",
        pair: "ETH/USDC",
        maker: "0xMaker",
        taker: "0xTaker",
        timestamp: 1700000000,
      });

      expect(result).toBe("Audit-friendly report text.");
      const body = JSON.parse(
        (fetchSpy.mock.calls[0][1] as { body: string }).body,
      );
      expect(body.question).toContain("0xABCD");
      expect(body.question).toContain("ETH/USDC");
      expect(body.question).toContain("0xMaker");
      expect(body.question).toContain("0xTaker");
      expect(body.question).toContain("1700000000");
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                              generateNftReceipt                            */
/* -------------------------------------------------------------------------- */

describe("generateNftReceipt", () => {
  // Helper: image data {type:"Buffer",data:[...]}
  function imageBody(bytes: number[]) {
    return {
      statusCode: 200,
      data: { type: "Buffer" as const, data: bytes },
    };
  }

  describe("positive cases", () => {
    test("returns base64 data URL and computed fingerprint for Direct mode", async () => {
      mockFetchOk(imageBody([0xff, 0xd8, 0xff, 0xe0])); // JPEG magic bytes
      const r = await generateNftReceipt({
        intentId: "12",
        pair: "ETH/USDC",
        mode: "Direct",
        txHash: "0xabcdef1234567890",
        blockNumber: "1234567",
        timestamp: 1700000000_000,
        makerAddress: "0xDEADBEEF1234",
        sellHandle: "0x123456789abcdef0",
      });
      expect(r.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
      expect(r.fingerprint).toBe("IX0012-ABCDEF-B234567");
      expect(r.prompt).toContain("Bilateral");
    });

    test("uses RFQ visual theme when mode is RFQ", async () => {
      mockFetchOk(imageBody([0x01]));
      const r = await generateNftReceipt({
        intentId: "5",
        pair: "BTC/USDT",
        mode: "RFQ",
      });
      expect(r.prompt).toContain("Vickrey");
      expect(r.prompt).toContain("envelopes");
    });

    test("posts to /nft/generate-image with velogen model and 512x512", async () => {
      const fetchSpy = mockFetchOk(imageBody([0x00]));
      await generateNftReceipt({
        intentId: "1",
        pair: "ETH/USDC",
        mode: "Direct",
      });
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.chaingpt.org/nft/generate-image",
        expect.any(Object),
      );
      const body = JSON.parse(
        (fetchSpy.mock.calls[0][1] as { body: string }).body,
      );
      expect(body.model).toBe("velogen");
      expect(body.width).toBe(512);
      expect(body.height).toBe(512);
    });
  });

  describe("negative cases", () => {
    test("throws on non-OK HTTP status with truncated body", async () => {
      mockFetchError(500, "x".repeat(300));
      await expect(
        generateNftReceipt({ intentId: "1", pair: "ETH/USDC", mode: "Direct" }),
      ).rejects.toThrow(/NFT generate failed: 500/);
    });

    test("throws when response missing data.data array", async () => {
      mockFetchOk({ statusCode: 200 }); // no data
      await expect(
        generateNftReceipt({ intentId: "1", pair: "ETH/USDC", mode: "Direct" }),
      ).rejects.toThrow("NFT response missing image data");
    });

    test("throws when data.data is not an array", async () => {
      mockFetchOk({ statusCode: 200, data: { type: "Buffer", data: "wrong" } });
      await expect(
        generateNftReceipt({ intentId: "1", pair: "ETH/USDC", mode: "Direct" }),
      ).rejects.toThrow("NFT response missing image data");
    });
  });

  describe("edge cases", () => {
    test("falls back to ENCRYPTED/PENDING/0000 when optional fields omitted", async () => {
      mockFetchOk(imageBody([0x00]));
      const r = await generateNftReceipt({
        intentId: "1",
        pair: "ETH/USDC",
        mode: "Direct",
        // no txHash, blockNumber, timestamp, makerAddress, sellHandle
      });
      expect(r.fingerprint).toBe("IX0001"); // only intentId portion (no joining suffix)
      expect(r.prompt).toContain("Maker tag: 0x0000");
      expect(r.prompt).toContain("Encrypted handle signature: 0xENCRYPTED");
      expect(r.prompt).toContain("Tx fingerprint: PENDING");
    });

    test("pads short intentId to 4 digits (IX0001)", async () => {
      mockFetchOk(imageBody([0x00]));
      const r = await generateNftReceipt({
        intentId: "1",
        pair: "ETH/USDC",
        mode: "Direct",
      });
      expect(r.fingerprint.startsWith("IX0001")).toBe(true);
    });

    test("preserves long intentId without truncation", async () => {
      mockFetchOk(imageBody([0x00]));
      const r = await generateNftReceipt({
        intentId: "99999",
        pair: "ETH/USDC",
        mode: "Direct",
      });
      expect(r.fingerprint).toBe("IX99999");
    });

    test("uses last 6 chars of blockNumber for telemetry tag", async () => {
      mockFetchOk(imageBody([0x00]));
      const r = await generateNftReceipt({
        intentId: "1",
        pair: "ETH/USDC",
        mode: "Direct",
        blockNumber: "1234567890",
      });
      expect(r.fingerprint).toContain("B567890");
    });

    test("encodes empty image array as empty base64 (corner-case data)", async () => {
      mockFetchOk(imageBody([]));
      const r = await generateNftReceipt({
        intentId: "1",
        pair: "ETH/USDC",
        mode: "Direct",
      });
      expect(r.imageDataUrl).toBe("data:image/jpeg;base64,");
    });
  });
});
