import { useId, useState } from "react";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePreferences } from "../preferences/context";
import { prepareMomentumChart } from "../utils/momentumChart";
import MomentumTooltip from "./MomentumTooltip";

export default function MomentumChart({ momentumPoints, opponentName, periodLength = 600, regulationPeriods = 4, recordedPeriods = 0 }) {
  const { t, teamName } = usePreferences();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [chartHeight, setChartHeight] = useState(240);
  const strokeId = `${id}-momentum-stroke`;
  const fillId = `${id}-momentum-fill`;
  const { data, duration, periods, limit, length, hasScores } = prepareMomentumChart(momentumPoints, periodLength, regulationPeriods, recordedPeriods);
  const periodLabels = Array.from({ length: periods }, (_, index) => ({
    center: (index + 0.5) * length,
    label: t(index < regulationPeriods ? `Q${index + 1}` : `OT${index + 1 - regulationPeriods}`),
  }));

  return <section className="momentum-chart rounded-2xl border border-line bg-background p-3 sm:p-5" aria-label={t("Scoring momentum")}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-ink">{t("Scoring momentum")}</h3>
        <p className="mt-1 text-xs text-muted">{t("Lead from recorded scoring events")}</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-2"><span className="momentum-team-dot" />{teamName("Afeka")}</span>
        <span className="inline-flex items-center gap-2"><span className="momentum-opponent-dot" />{teamName(opponentName)}</span>
      </div>
    </div>
    {hasScores ? <div dir="ltr" className="momentum-plot" aria-label={t("Scoring momentum: Afeka College score minus opponent score by period and game clock")}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 240 }} onResize={(_, height) => setChartHeight(height)}>
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
          <defs>
            <linearGradient id={strokeId} gradientUnits="userSpaceOnUse" x1="0" y1={12} x2="0" y2={chartHeight - 28}>
              <stop offset="50%" stopColor="var(--momentum-team)" />
              <stop offset="50%" stopColor="var(--momentum-opponent)" />
            </linearGradient>
            <linearGradient id={fillId} gradientUnits="userSpaceOnUse" x1="0" y1={12} x2="0" y2={chartHeight - 28}>
              <stop offset="0%" stopColor="var(--momentum-team)" stopOpacity={0.24} />
              <stop offset="50%" stopColor="var(--momentum-team)" stopOpacity={0.025} />
              <stop offset="50%" stopColor="var(--momentum-opponent)" stopOpacity={0.025} />
              <stop offset="100%" stopColor="var(--momentum-opponent)" stopOpacity={0.24} />
            </linearGradient>
          </defs>
          <XAxis dataKey="gameSecond" type="number" domain={[0, duration]} ticks={periodLabels.map(period => period.center)}
            tickFormatter={value => periodLabels.find(period => period.center === value)?.label ?? ""}
            axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted)", fontSize: 11 }} minTickGap={8} height={28} />
          <YAxis domain={[-limit, limit]} ticks={[-limit, 0, limit]} width={34} axisLine={false} tickLine={false}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }} tickFormatter={value => value > 0 ? `+${value}` : String(value)} />
          {periodLabels.slice(1).map((period, index) => <ReferenceLine key={period.center} x={(index + 1) * length} stroke="var(--color-line)" strokeDasharray="3 6" />)}
          <ReferenceLine y={0} stroke="var(--color-muted)" strokeOpacity={0.55} />
          <Tooltip content={<MomentumTooltip opponentName={opponentName} regulationPeriods={regulationPeriods} />}
            cursor={{ stroke: "var(--color-muted)", strokeDasharray: "3 4" }} isAnimationActive={false} />
          <Area type="monotoneX" dataKey="scoreDiff" baseValue={0} stroke={`url(#${strokeId})`} strokeWidth={2.5}
            fill={`url(#${fillId})`} fillOpacity={1} dot={false}
            activeDot={{ r: 4, fill: "var(--color-ink)", stroke: "var(--color-surface)", strokeWidth: 2 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div> : <p className="flex min-h-40 items-center justify-center text-center text-sm text-muted">{t("No scoring events recorded.")}</p>}
  </section>;
}
