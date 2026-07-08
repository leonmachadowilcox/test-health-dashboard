// Pure helpers for color-coding the pass-rate trend chart. Pulled out of
// TrendChart.tsx so the threshold logic and gradient math can be unit
// tested without rendering Recharts.

/** Mirrors the `status` colors in tailwind.config.js so the trend line
 *  uses the same palette as StatusBadge elsewhere in the app. */
export const TREND_COLORS = {
  good: "#22c55e", // green — pass rate > 90
  warn: "#eab308", // yellow — pass rate 75-90
  bad: "#ef4444", // red — pass rate < 75
} as const;

export type TrendColorLevel = keyof typeof TREND_COLORS;

/** Classifies a 0-100 pass rate into a color level per the Day 4 spec:
 *  green >90, yellow 75-90 (inclusive), red <75. */
export function trendColorLevel(passRate: number): TrendColorLevel {
  if (passRate > 90) return "good";
  if (passRate >= 75) return "warn";
  return "bad";
}

export function trendColorForPassRate(passRate: number): string {
  return TREND_COLORS[trendColorLevel(passRate)];
}

export interface GradientStop {
  offset: string;
  color: string;
}

/**
 * Builds SVG `<linearGradient>` stops so a single Recharts `<Line>` can
 * shift color along its length based on each point's pass rate, instead of
 * being stuck with one flat stroke color for the whole trend.
 *
 * Returns one stop per data point, evenly spaced left-to-right. A
 * single-point (or empty) series collapses to one stop at 0%.
 */
export function buildTrendGradientStops(passRates: number[]): GradientStop[] {
  if (passRates.length <= 1) {
    const rate = passRates[0] ?? 0;
    return [{ offset: "0%", color: trendColorForPassRate(rate) }];
  }

  return passRates.map((rate, index) => ({
    offset: `${(index / (passRates.length - 1)) * 100}%`,
    color: trendColorForPassRate(rate),
  }));
}
