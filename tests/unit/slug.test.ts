import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("creates predictable slugs", () => {
    expect(slugify("CORN DOWN 101: Placeholder Harvest")).toBe("corn-down-101-placeholder-harvest");
  });
});
