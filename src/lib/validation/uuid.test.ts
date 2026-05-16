import { describe, expect, it } from "vitest";
import { looksLikeUuid } from "@/lib/validation/uuid";

describe("looksLikeUuid", () => {
  it("accepts well-formed ids", () => {
    expect(
      looksLikeUuid("550e8400-e29b-41d4-a716-446655440000")
    ).toBe(true);
  });

  it("rejects garbage cookie values", () => {
    expect(looksLikeUuid("fake-room")).toBe(false);
    expect(looksLikeUuid("")).toBe(false);
  });
});
