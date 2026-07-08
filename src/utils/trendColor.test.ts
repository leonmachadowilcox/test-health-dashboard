import { describe, it, expect } from "vitest";
import {
  trendColorLevel,
  trendColorForPassRate,
  buildTrendGradientStops,
  TREND_COLORS,
} from "./trendColor";

describe("trendColorLevel", () => {
  it("is 'good' for pass rates above 90", () => {
    expect(trendColorLevel(90.1)).toBe("good");
    expect(trendColorLevel(100)).toBe("good");
  });

  it("is 'warn' for pass rates from 75 up to and including 90", () => {
    expect(trendColorLevel(90)).toBe("warn");
    expect(trendColorLevel(75)).toBe("warn");
    expect(trendColorLevel(82.5)).toBe("warn");
  });

  it("is 'bad' for pass rates below 75", () => {
    expect(trendColorLevel(74.9)).toBe("bad");
    expect(trendColorLevel(0)).toBe("bad");
  });
});

describe("trendColorForPassRate", () => {
  it("maps each level to its configured hex color", () => {
    expect(trendColorForPassRate(95)).toBe(TREND_COLORS.good);
    expect(trendColorForPassRate(80)).toBe(TREND_COLORS.warn);
    expect(trendColorForPassRate(50)).toBe(TREND_COLORS.bad);
  });
});

describe("buildTrendGradientStops", () => {
  it("returns one evenly-spaced stop per data point", () => {
    const stops = buildTrendGradientStops([50, 80, 95]);
    expect(stops).toEqual([
      { offset: "0%", color: TREND_COLORS.bad },
      { offset: "50%", color: TREND_COLORS.warn },
      { offset: "100%", color: TREND_COLORS.good },
    ]);
  });

  it("collapses a single point to one stop at 0%", () => {
    expect(buildTrendGradientStops([95])).toEqual([
      { offset: "0%", color: TREND_COLORS.good },
    ]);
  });

  it("defaults to a 'bad' stop at 0% for an empty series", () => {
    expect(buildTrendGradientStops([])).toEqual([
      { offset: "0%", color: TREND_COLORS.bad },
    ]);
  });
});
