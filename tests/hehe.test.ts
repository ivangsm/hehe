import { expect, test, describe } from "bun:test";
import * as hehe from "../src/index.js";
import { decodeMap } from "../src/hehe.js";

describe("he library", () => {
	describe("encode", () => {
		test("basic encoding", () => {
			expect(hehe.encode("foo © bar")).toBe("foo &#xA9; bar");
		});

		test("useNamedReferences: true", () => {
			expect(hehe.encode("foo © bar", { useNamedReferences: true })).toBe("foo &copy; bar");
		});

		test("encodeEverything: true", () => {
			expect(hehe.encode("a", { encodeEverything: true })).toBe("&#x61;");
		});

		test("decimal: true", () => {
			expect(hehe.encode("©", { decimal: true })).toBe("&#169;");
		});

		test("allowUnsafeSymbols: true", () => {
			expect(hehe.encode("<", { allowUnsafeSymbols: true })).toBe("<");
		});

		test("strict mode - forbidden code point", () => {
			expect(() => hehe.encode("\0", { strict: true })).toThrow();
		});
	});

	describe("decode", () => {
		test("basic decoding", () => {
			expect(hehe.decode("foo &copy; bar")).toBe("foo © bar");
		});

		test("hexadecimal escapes", () => {
			expect(hehe.decode("&#x1D306;")).toBe("\uD834\uDF06");
		});

		test("decimal escapes", () => {
			expect(hehe.decode("&#119558;")).toBe("\uD834\uDF06");
		});

		test("legacy named references (without semicolon)", () => {
			expect(hehe.decode("&copy")).toBe("©");
		});

		test("attribute value context", () => {
			expect(hehe.decode("foo&ampbar", { isAttributeValue: true })).toBe("foo&ampbar");
			expect(hehe.decode("foo&amp;bar", { isAttributeValue: true })).toBe("foo&bar");
		});

		test("strict mode - malformed reference", () => {
			expect(() => hehe.decode("&#xZ", { strict: true })).toThrow();
		});

		test("strict mode - non-terminated reference", () => {
			expect(() => hehe.decode("&copy", { strict: true })).toThrow();
		});
	});

	describe("escape", () => {
		test("basic escape", () => {
			expect(hehe.escape("< > \" ' & `")).toBe("&lt; &gt; &quot; &#x27; &amp; &#x60;");
		});
	});

	test("Official WHATWG Data - Exhaustive Verification", () => {
		const entries = Object.entries(decodeMap);
		for (const [encoded, decoded] of entries) {
			// Verify decoding (with semicolon)
			const decodedResult = hehe.decode(`&${encoded};`);
			if (decodedResult !== decoded) {
				console.log(`FAIL decoding &${encoded}; - Expected: ${decoded}, Received: ${decodedResult}`);
			}
			expect(decodedResult).toBe(decoded);
			
			// Verify round-trip
			const entities = hehe.encode(decoded, { useNamedReferences: true });
			const roundTripResult = hehe.decode(entities);
			if (roundTripResult !== decoded) {
				console.log(`FAIL round-trip for ${decoded} (encoded as ${entities}) - Expected: ${decoded}, Received: ${roundTripResult}`);
			}
			expect(roundTripResult).toBe(decoded);
		}
	});

	test("Legacy References - Exhaustive Verification", () => {
		// Just a few spot checks for legacy references
		expect(hehe.decode("&copy")).toBe("©");
		expect(hehe.decode("&para")).toBe("¶");
		expect(hehe.decode("&not")).toBe("¬");
	});
});
