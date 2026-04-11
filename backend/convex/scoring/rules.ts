import { CURRENT_RULE_VERSION } from "../lib/constants";

// ─── Versioned Scoring Rules ────────────────────────────────────
// Each rule computes a score 0-100 from event data.
// Higher scores for focus/balance = better. Higher for stress/fatigue = worse.

interface EventSummary {
  totalScreenMinutes: number;
  tabSwitches: number;
  sessionCount: number;
  avgSessionMinutes: number;
  longestSessionMinutes: number;
  breaksTaken: number;
  nightUsageHours: number[];   // hours (0-23) with screen activity
  productiveMinutes: number;
  leisureMinutes: number;
  movementMinutes: number;
  codingMinutes: number;
  buildSuccessRate: number;    // 0-1
  totalEvents: number;
}

interface ScoreBreakdown {
  focus: {
    tabSwitchRate: number;
    longSessionRatio: number;
    productiveRatio: number;
  };
  stress: {
    nightUsageScore: number;
    highScreenTime: number;
    lowBreakFrequency: number;
  };
  fatigue: {
    sessionLengthScore: number;
    timeOfDayWeight: number;
    breakDeficit: number;
  };
  balance: {
    productiveVsLeisure: number;
    movementScore: number;
    screenTimeVariance: number;
  };
}

interface ComputedScores {
  focus: number;
  stress: number;
  fatigue: number;
  balance: number;
  overall: number;
  breakdown: ScoreBreakdown;
  ruleVersion: string;
}

// ─── Helper: clamp to 0-100 ────────────────────────────────────
function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

// ─── v1.0 Rules ─────────────────────────────────────────────────
export function computeScoresV1(summary: EventSummary): ComputedScores {
  // ── Focus Score ─────────────────────────────────────────────
  // Low tab switching + long focused sessions + productive usage = high focus
  const tabSwitchRate =
    summary.totalScreenMinutes > 0
      ? summary.tabSwitches / (summary.totalScreenMinutes / 60)
      : 0;
  const tabSwitchScore = clamp(100 - tabSwitchRate * 5); // penalize >20 switches/hr

  const longSessionRatio =
    summary.sessionCount > 0
      ? summary.longestSessionMinutes / (summary.avgSessionMinutes || 1)
      : 0;
  const longSessionScore = clamp(Math.min(longSessionRatio * 30, 100));

  const productiveRatio =
    summary.totalScreenMinutes > 0
      ? summary.productiveMinutes / summary.totalScreenMinutes
      : 0.5;
  const productiveScore = clamp(productiveRatio * 100);

  const focusScore = clamp(
    tabSwitchScore * 0.4 + longSessionScore * 0.3 + productiveScore * 0.3
  );

  // ── Stress Score ────────────────────────────────────────────
  // Night usage + excessive screen time + few breaks = high stress
  const nightUsage = summary.nightUsageHours.filter(
    (h) => h >= 22 || h <= 5
  ).length;
  const nightScore = clamp(nightUsage * 15); // each late-night hour adds 15

  const screenTimeHours = summary.totalScreenMinutes / 60;
  const highScreenScore = clamp(
    screenTimeHours > 8 ? (screenTimeHours - 8) * 20 : 0
  );

  const expectedBreaks = Math.floor(summary.totalScreenMinutes / 50);
  const breakDeficiency =
    expectedBreaks > 0
      ? 1 - summary.breaksTaken / expectedBreaks
      : 0;
  const lowBreakScore = clamp(breakDeficiency * 100);

  const stressScore = clamp(
    nightScore * 0.35 + highScreenScore * 0.35 + lowBreakScore * 0.3
  );

  // ── Fatigue Score ───────────────────────────────────────────
  // Long sessions without breaks + late-day activity = high fatigue
  const sessionLengthScore = clamp(
    summary.longestSessionMinutes > 120
      ? ((summary.longestSessionMinutes - 120) / 60) * 30
      : 0
  );

  const lateHours = summary.nightUsageHours.filter(
    (h) => h >= 18 || h <= 3
  ).length;
  const timeOfDayWeight = clamp(lateHours * 12);

  const breakDeficitScore = clamp(breakDeficiency * 80);

  const fatigueScore = clamp(
    sessionLengthScore * 0.4 +
      timeOfDayWeight * 0.3 +
      breakDeficitScore * 0.3
  );

  // ── Balance Score ───────────────────────────────────────────
  // Good ratio of productive vs leisure + movement + consistent screen time
  const pvlRatio =
    summary.productiveMinutes + summary.leisureMinutes > 0
      ? summary.productiveMinutes /
        (summary.productiveMinutes + summary.leisureMinutes)
      : 0.5;
  // Ideal ratio is ~0.6-0.7 (not 100% productive)
  const pvlScore = clamp(100 - Math.abs(pvlRatio - 0.65) * 200);

  const movementTarget = 30; // 30 min/day target
  const movementScore = clamp(
    (summary.movementMinutes / movementTarget) * 100
  );

  // Variance penalty: more consistent = better
  const screenVariance =
    summary.totalScreenMinutes > 0
      ? Math.abs(summary.totalScreenMinutes - 360) / 360
      : 0;
  const varianceScore = clamp(100 - screenVariance * 100);

  const balanceScore = clamp(
    pvlScore * 0.35 + movementScore * 0.35 + varianceScore * 0.3
  );

  // ── Overall Score ───────────────────────────────────────────
  const overall = clamp(
    focusScore * 0.3 +
      (100 - stressScore) * 0.25 + // invert: low stress is good
      (100 - fatigueScore) * 0.2 + // invert: low fatigue is good
      balanceScore * 0.25
  );

  return {
    focus: focusScore,
    stress: stressScore,
    fatigue: fatigueScore,
    balance: balanceScore,
    overall,
    ruleVersion: CURRENT_RULE_VERSION,
    breakdown: {
      focus: {
        tabSwitchRate: tabSwitchScore,
        longSessionRatio: longSessionScore,
        productiveRatio: productiveScore,
      },
      stress: {
        nightUsageScore: nightScore,
        highScreenTime: highScreenScore,
        lowBreakFrequency: lowBreakScore,
      },
      fatigue: {
        sessionLengthScore,
        timeOfDayWeight,
        breakDeficit: breakDeficitScore,
      },
      balance: {
        productiveVsLeisure: pvlScore,
        movementScore,
        screenTimeVariance: varianceScore,
      },
    },
  };
}

// ─── Summarize raw events for scoring ───────────────────────────
export function summarizeEvents(
  events: Array<{
    type: string;
    source: string;
    category?: string;
    payload: Record<string, unknown>;
    timestamp: number;
  }>
): EventSummary {
  let totalScreenMinutes = 0;
  let tabSwitches = 0;
  let breaksTaken = 0;
  let productiveMinutes = 0;
  let leisureMinutes = 0;
  let movementMinutes = 0;
  let codingMinutes = 0;
  let buildSuccesses = 0;
  let buildTotal = 0;
  const nightUsageHours: Set<number> = new Set();
  const sessions: number[] = []; // durations in minutes

  for (const event of events) {
    const duration = (event.payload.durationMinutes as number) ?? 0;
    const hour = new Date(event.timestamp).getHours();

    switch (event.type) {
      case "tab_switch":
        tabSwitches++;
        break;
      case "break_taken":
        breaksTaken++;
        break;
      case "session_start":
      case "session_end":
        if (duration > 0) sessions.push(duration);
        break;
      case "night_usage":
        nightUsageHours.add(
          (event.payload.hourBucket as number) ?? hour
        );
        break;
      case "coding_session":
        codingMinutes += duration;
        break;
      case "build_result":
        buildTotal++;
        if (event.payload.buildSuccess) buildSuccesses++;
        break;
      case "movement_detected":
        movementMinutes += duration;
        break;
      default:
        break;
    }

    // Track screen time by source
    if (event.source === "chrome" || event.source === "vscode") {
      if (duration > 0) totalScreenMinutes += duration;
      nightUsageHours.add(hour);
    }

    // Track category time
    if (event.category === "productivity" || event.category === "education") {
      productiveMinutes += duration;
    } else if (
      event.category === "social" ||
      event.category === "entertainment"
    ) {
      leisureMinutes += duration;
    }
  }

  const avgSessionMinutes =
    sessions.length > 0
      ? sessions.reduce((a, b) => a + b, 0) / sessions.length
      : 0;

  return {
    totalScreenMinutes,
    tabSwitches,
    sessionCount: sessions.length,
    avgSessionMinutes,
    longestSessionMinutes:
      sessions.length > 0 ? Math.max(...sessions) : 0,
    breaksTaken,
    nightUsageHours: Array.from(nightUsageHours),
    productiveMinutes,
    leisureMinutes,
    movementMinutes,
    codingMinutes,
    buildSuccessRate: buildTotal > 0 ? buildSuccesses / buildTotal : 0,
    totalEvents: events.length,
  };
}
