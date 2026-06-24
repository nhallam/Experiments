import { describe, it, expect } from "vitest";
import { weekWindowFor } from "../src/lib/week";

// US Eastern: EDT (UTC-4) in summer, EST (UTC-5) in winter.
const TZ = "America/New_York";

describe("weekWindowFor", () => {
  it("captures the Mon–Sun week when the cron fires Sunday ~23:59 ET (summer/EDT)", () => {
    // 2026-06-21 is a Sunday. Sunday 23:59 EDT == Monday 2026-06-22 03:59 UTC.
    const fire = new Date("2026-06-22T03:59:00.000Z");
    const w = weekWindowFor(fire, TZ);
    expect(w.startYmd).toBe("2026-06-15"); // Monday
    expect(w.endYmd).toBe("2026-06-21"); // Sunday
    // Monday 00:00 EDT == 04:00 UTC; Sunday 23:59:59.999 EDT == Mon 03:59:59.999 UTC.
    expect(w.start.toISOString()).toBe("2026-06-15T04:00:00.000Z");
    expect(w.end.toISOString()).toBe("2026-06-22T03:59:59.999Z");
  });

  it("captures the right week when firing earlier on Sunday evening (winter/EST)", () => {
    // 2026-01-11 is a Sunday. Sunday 22:59 EST == Monday 2026-01-12 03:59 UTC.
    const fire = new Date("2026-01-12T03:59:00.000Z");
    const w = weekWindowFor(fire, TZ);
    expect(w.startYmd).toBe("2026-01-05"); // Monday
    expect(w.endYmd).toBe("2026-01-11"); // Sunday
    // EST is UTC-5: Monday 00:00 EST == 05:00 UTC.
    expect(w.start.toISOString()).toBe("2026-01-05T05:00:00.000Z");
    expect(w.end.toISOString()).toBe("2026-01-12T04:59:59.999Z");
  });

  it("groups a mid-week instant into its containing Mon–Sun week", () => {
    // Wednesday 2026-06-17, midday ET.
    const wed = new Date("2026-06-17T16:00:00.000Z");
    const w = weekWindowFor(wed, TZ);
    expect(w.startYmd).toBe("2026-06-15");
    expect(w.endYmd).toBe("2026-06-21");
  });

  it("honors a different timezone (UTC)", () => {
    // Sunday 2026-06-21 23:30 UTC stays in the 15th–21st week.
    const fire = new Date("2026-06-21T23:30:00.000Z");
    const w = weekWindowFor(fire, "UTC");
    expect(w.startYmd).toBe("2026-06-15");
    expect(w.endYmd).toBe("2026-06-21");
    expect(w.start.toISOString()).toBe("2026-06-15T00:00:00.000Z");
    expect(w.end.toISOString()).toBe("2026-06-21T23:59:59.999Z");
  });
});
