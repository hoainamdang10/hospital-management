import { normalizePriority } from "../../../../src/domain/services/priority-normalizer";

describe("normalizePriority", () => {
  it("should default to NORMAL when value missing", () => {
    expect(normalizePriority()).toBe("NORMAL");
    expect(normalizePriority("")).toBe("NORMAL");
  });

  it("should map aliases to NotificationPriority", () => {
    expect(normalizePriority("urgent")).toBe("URGENT");
    expect(normalizePriority("emergency")).toBe("URGENT");
    expect(normalizePriority("critical")).toBe("URGENT");
    expect(normalizePriority("high")).toBe("HIGH");
    expect(normalizePriority("important")).toBe("HIGH");
    expect(normalizePriority("normal")).toBe("NORMAL");
    expect(normalizePriority("routine")).toBe("NORMAL");
    expect(normalizePriority("low")).toBe("LOW");
    expect(normalizePriority("minor")).toBe("LOW");
  });

  it("should handle numeric levels and P0..Pn patterns", () => {
    expect(normalizePriority("0")).toBe("URGENT");
    expect(normalizePriority("1")).toBe("URGENT");
    expect(normalizePriority("2")).toBe("HIGH");
    expect(normalizePriority("3")).toBe("NORMAL");
    expect(normalizePriority("4")).toBe("LOW");
    expect(normalizePriority("p0")).toBe("URGENT");
    expect(normalizePriority("p1")).toBe("HIGH");
    expect(normalizePriority("p2")).toBe("NORMAL");
    expect(normalizePriority("p4")).toBe("LOW");
  });

  it("should trim whitespace and ignore casing", () => {
    expect(normalizePriority("  UrGent ")).toBe("URGENT");
    expect(normalizePriority("High")).toBe("HIGH");
  });
});
