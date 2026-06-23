import type { ProviderUsageSnapshot } from "./usage";

describe("normalizeProviderUsage", () => {
  it("creates the shared display model for a provider snapshot", async () => {
    const usageModule = await import("./usage");
    const normalizeProviderUsage = Reflect.get(
      usageModule,
      "normalizeProviderUsage",
    );

    expect(typeof normalizeProviderUsage).toBe("function");

    if (typeof normalizeProviderUsage !== "function") {
      return;
    }

    const snapshot: ProviderUsageSnapshot = {
      provider: "codex",
      displayName: "Codex",
      sessionPercent: 42,
      sessionResetAt: "2026-01-25T05:00:00.000Z",
      weeklyPercent: 18,
      weeklyResetAt: "2026-01-31T13:20:00.000Z",
      lastUpdated: "2026-03-28T02:00:00.000Z",
    };

    expect(
      normalizeProviderUsage(snapshot, {
        language: "en",
        timeDisplay: "utc",
        timeFormat: "24h",
      }),
    ).toEqual({
      provider: "codex",
      displayName: "Codex",
      health: "available",
      session: {
        label: "Session",
        percent: 42,
        resetLabel: "2026-01-25 05:00 UTC",
        level: "normal",
      },
      weekly: {
        label: "Weekly",
        percent: 18,
        resetLabel: "2026-01-31 13:20 UTC",
        level: "normal",
      },
      lastUpdated: "2026-03-28T02:00:00.000Z",
    });
  });

  it("formats reset time in local 12-hour mode when requested", async () => {
    const usageModule = await import("./usage");
    const normalizeProviderUsage = Reflect.get(
      usageModule,
      "normalizeProviderUsage",
    );

    expect(typeof normalizeProviderUsage).toBe("function");

    if (typeof normalizeProviderUsage !== "function") {
      return;
    }

    const snapshot: ProviderUsageSnapshot = {
      provider: "claude",
      displayName: "Claude",
      sessionPercent: 12,
      sessionResetAt: "2026-03-29T13:40:00.000Z",
      weeklyPercent: 80,
      weeklyResetAt: "2026-04-03T06:18:00.000Z",
      lastUpdated: "2026-03-28T02:00:00.000Z",
    };

    const normalized = normalizeProviderUsage(snapshot, {
      language: "en",
      timeDisplay: "utc",
      timeFormat: "12h",
    });

    expect(normalized.session.resetLabel).toBe("2026-03-29 01:40 PM UTC");
    expect(normalized.weekly.level).toBe("warning");
  });

  it("supports alternate date formats for reset labels", async () => {
    const usageModule = await import("./usage");
    const normalizeProviderUsage = Reflect.get(
      usageModule,
      "normalizeProviderUsage",
    );

    expect(typeof normalizeProviderUsage).toBe("function");

    if (typeof normalizeProviderUsage !== "function") {
      return;
    }

    const snapshot: ProviderUsageSnapshot = {
      provider: "codex",
      displayName: "Codex",
      sessionPercent: 42,
      sessionResetAt: "2026-01-25T05:00:00.000Z",
      weeklyPercent: 18,
      weeklyResetAt: "2026-01-31T13:20:00.000Z",
      lastUpdated: "2026-03-28T02:00:00.000Z",
    };

    const normalized = normalizeProviderUsage(snapshot, {
      language: "en",
      timeDisplay: "utc",
      timeFormat: "24h",
      dateFormat: "mdy",
    });

    expect(normalized.session.resetLabel).toBe("01/25/2026 05:00 UTC");
    expect(normalized.weekly.resetLabel).toBe("01/31/2026 13:20 UTC");
  });

  it("uses custom warning and danger thresholds when calculating usage levels", async () => {
    const usageModule = await import("./usage");
    const normalizeProviderUsage = Reflect.get(
      usageModule,
      "normalizeProviderUsage",
    );

    expect(typeof normalizeProviderUsage).toBe("function");

    if (typeof normalizeProviderUsage !== "function") {
      return;
    }

    const snapshot: ProviderUsageSnapshot = {
      provider: "claude",
      displayName: "Claude",
      sessionPercent: 66,
      sessionResetAt: "2026-03-29T13:40:00.000Z",
      weeklyPercent: 88,
      weeklyResetAt: "2026-04-03T06:18:00.000Z",
      lastUpdated: "2026-03-28T02:00:00.000Z",
    };

    const normalized = normalizeProviderUsage(snapshot, {
      language: "en",
      timeDisplay: "utc",
      timeFormat: "24h",
      warningThreshold: 60,
      dangerThreshold: 85,
    });

    expect(normalized.session.level).toBe("warning");
    expect(normalized.weekly.level).toBe("danger");
  });

  it("formats local Codex token and cost details", async () => {
    const usageModule = await import("./usage");
    const normalizeProviderUsage = Reflect.get(
      usageModule,
      "normalizeProviderUsage",
    );

    expect(typeof normalizeProviderUsage).toBe("function");

    if (typeof normalizeProviderUsage !== "function") {
      return;
    }

    const snapshot: ProviderUsageSnapshot = {
      provider: "codex",
      displayName: "Codex",
      sessionPercent: 0,
      sessionResetAt: null,
      weeklyPercent: 12,
      weeklyResetAt: "2026-06-29T00:00:00.000Z",
      monthlyPercent: 4,
      monthlyResetAt: "2026-07-01T00:00:00.000Z",
      lastUpdated: "2026-06-23T02:22:38.325Z",
      localUsage: {
        source: "codex-local",
        inputTokens: 5000,
        cachedInputTokens: 1800,
        outputTokens: 300,
        reasoningOutputTokens: 50,
        totalTokens: 5300,
        estimatedCostUsd: 0.00777,
        dailyCostUsd: 0.001,
        weeklyCostUsd: 0.006,
        monthlyCostUsd: 0.00777,
        dailyLimitUsd: 10,
        weeklyLimitUsd: 50,
        monthlyLimitUsd: 200,
        providerMultiplier: 2,
        sessionCount: 2,
        model: "gpt-5.4-mini",
        pricingModel: "gpt-5.4-mini",
      },
    };

    const normalized = normalizeProviderUsage(snapshot, {
      language: "en",
      timeDisplay: "utc",
      timeFormat: "24h",
    });

    expect(normalized.session.label).toBe("Daily");
    expect(normalized.weekly.percent).toBe(12);
    expect(normalized.monthly?.label).toBe("Monthly");
    expect(normalized.monthly?.percent).toBe(4);
    expect(normalized.localUsage).toEqual({
      sourceLabel: "Local Codex data",
      totalTokensLabel: "5.3K tokens",
      estimatedCostLabel: "Estimated cost $0.0078",
      multiplierLabel: "Provider multiplier x2.0",
      modelLabel: "Pricing model gpt-5.4-mini",
      sessionCountLabel: "2 sessions",
      tokenBreakdownLabel: "Input/cached/output/reasoning 5K / 1.8K / 300 / 50",
    });
  });
});
