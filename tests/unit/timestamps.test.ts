import { describe, expect, it } from "vitest";
import { formatTimestamp, parseTimestamp } from "@/lib/timestamps";

describe("timestamps", () => {
  it("formats seconds as hh:mm:ss", () => {
    expect(formatTimestamp(5025)).toBe("01:23:45");
  });

  it("parses hh:mm:ss and raw seconds", () => {
    expect(parseTimestamp("01:23:45")).toBe(5025);
    expect(parseTimestamp("90")).toBe(90);
  });
});
