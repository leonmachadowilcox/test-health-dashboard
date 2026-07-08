import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RunHistoryEntry } from "../types/testRun";
import { buildTrendGradientStops, trendColorForPassRate } from "../utils/trendColor";

interface TrendChartProps {
  /** Upload history, newest first (as returned by GET /runs). */
  runs: RunHistoryEntry[];
  /** How many of the most recent runs to plot. Defaults to 20. */
  maxPoints?: number;
}

interface TrendPoint {
  label: string;
  passRate: number;
}

const GRADIENT_ID = "trend-line-gradient";

function formatLabel(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { month: "short", day: "numeric" });
}

export default function TrendChart({ runs, maxPoints = 20 }: TrendChartProps) {
  // `runs` is newest-first; reverse to chronological order for a
  // left-to-right timeline, then keep only the most recent `maxPoints`.
  const chronological = [...runs].reverse().slice(-maxPoints);
  const points: TrendPoint[] = chronological.map((run) => ({
    label: formatLabel(run.uploadedAt),
    passRate: run.summary.passRate,
  }));
  const gradientStops = buildTrendGradientStops(points.map((p) => p.passRate));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Pass Rate Trend</p>

      {points.length === 0 ? (
        <div className="mt-4 flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <p className="text-sm text-slate-400">
            No trend data yet — upload a test result file to get started.
          </p>
        </div>
      ) : (
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
                  {gradientStops.map((stop) => (
                    <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                  ))}
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "Pass rate"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }}
              />
              <Line
                type="monotone"
                dataKey="passRate"
                stroke={`url(#${GRADIENT_ID})`}
                strokeWidth={2.5}
                dot={(props: { cx?: number; cy?: number; payload?: TrendPoint }) => {
                  const { cx, cy, payload } = props;
                  if (cx == null || cy == null || !payload) return <g key={`${cx}-${cy}`} />;
                  return (
                    <circle
                      key={`${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill={trendColorForPassRate(payload.passRate)}
                      stroke="white"
                      strokeWidth={1}
                    />
                  );
                }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
