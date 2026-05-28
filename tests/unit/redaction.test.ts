import { describe, expect, it } from "vitest";
import { hasSensitiveMarkers, redactSensitiveText } from "@/lib/redaction";

describe("redaction", () => {
  it("redacts phone numbers and addresses", () => {
    const sample = "Call me at 555-123-4567 and meet me at 123 Main Street.";
    expect(redactSensitiveText(sample)).toContain("[redacted phone]");
    expect(redactSensitiveText(sample)).toContain("[redacted address]");
  });

  it("detects obvious sensitive markers", () => {
    expect(hasSensitiveMarkers("555-123-4567")).toBe(true);
  });
});
