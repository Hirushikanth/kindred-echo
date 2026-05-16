import { describe, expect, it } from "vitest";
import { createRoomSchema } from "@/lib/validation/roomCreate";

describe("createRoomSchema", () => {
  const iso = () => new Date().toISOString();

  it("parses minimal valid payload with empty memory extras", () => {
    const r = createRoomSchema.safeParse({
      lovedOneName: "May",
      relationship: "Grandmother",
      familyMemberName: "Alex",
      consentAt: iso(),
      memoryProfile: {},
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.memoryProfile.hobbies).toEqual([]);
    }
  });

  it("rejects blank loved one's name", () => {
    const r = createRoomSchema.safeParse({
      lovedOneName: "   ",
      relationship: "friend",
      familyMemberName: "Alex",
      consentAt: iso(),
      memoryProfile: {},
    });
    expect(r.success).toBe(false);
  });
});
