import { describe, expect, it } from "vitest";
import { parseCommaList, parseLineList } from "@/lib/setup/parse-memory-fields";

describe("parseCommaList / parseLineList", () => {
  it("splits commas and trims", () => {
    expect(parseCommaList(" knitting, quilting , ")).toEqual([
      "knitting",
      "quilting",
    ]);
  });

  it("splits newline lists", () => {
    expect(parseLineList(" first line\n  second\n")).toEqual(["first line", "second"]);
  });
});
