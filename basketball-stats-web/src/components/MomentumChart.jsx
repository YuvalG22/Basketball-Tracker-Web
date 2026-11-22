import { useId, useState } from "react";
import { Area, AreaChart, ReferenceArea, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { usePreferences } from "../preferences/context";
import { prepareMomentumChart } from "../utils/momentumChart";

export default function MomentumChart({ momentumPoints, opponentName, periodLength = 600, regulationPeriods = 4, recordedPeriods = 0 }) {
  const { t, teamName } = usePreferences();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [chartHeight, setChartHeight] = useState(128);
  const fillId = `${id}-momentum-fill`;
  const { data, duration, periods, limit, length, hasScores } = prepareMomentumChart(momentumPoints, periodLength, regulationPeriods, recordedPeriods);
  const periodLabels = Array.from({ length: periods }, (_, index) => ({
    boundary: (index + 1) * length,
    label: t(index < regulationPeriods ? `Q${index + 1}` : `OT${index + 1 - regulationPeriods}`),
  }));

  return <section className="momentum-chart rounded-2xl bg-background p-2 sm:p-3" aria-label={t("Scoring momentum")}>
    <div className="sr-only">
      <h3>{t("Scoring momentum")}</h3>
      <p>{t("Lead from recorded scoring events")}: {teamName("Afeka")} / {teamName(opponentName)}</p>
      <p>{periodLabels.map(period => period.label).join(" · ")}</p>
    </div>
    {hasScores ? <div dir="ltr" className="momentum-plot" aria-label={t("Scoring momentum: Afeka College score minus opponent score by period and game clock")}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 128 }} onResize={(_, height) => setChartHeight(height)}>
        <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 8, left: 0 }} accessibilityLayer={false} role="img" aria-label={t("Scoring momentum")}>
          <defs>
            <linearGradient id={fillId} gradientUnits="userSpaceOnUse" x1="0" y1={8} x2="0" y2={chartHeight - 8}>
              <stop offset="50%" stopColor="var(--momentum-team)" />
              <stop offset="50%" stopColor="var(--momentum-opponent)" />
            </linearGradient>
          </defs>
          <XAxis dataKey="gameSecond" type="number" domain={[0, duration]} hide />
          <YAxis orientation="right" domain={[-limit, limit]} ticks={[-limit, 0, limit]} interval={0} width={28} axisLine={false} tickLine={false}
            tick={{ fill: "var(--color-muted)", fontSize: 11, fontWeight: 600 }} tickFormatter={value => Math.abs(value)} />
          <ReferenceArea y1={0} y2={limit} fill="var(--momentum-team)" fillOpacity={0.12} stroke="none" />
          <ReferenceArea y1={-limit} y2={0} fill="var(--momentum-opponent)" fillOpacity={0.12} stroke="none" />
          {periodLabels.slice(0, -1).map(period => <ReferenceLine key={period.boundary} x={period.boundary} stroke="var(--color-line)" />)}
          <ReferenceLine y={0} stroke="var(--color-line)" />
          <Area type="linear" dataKey="scoreDiff" baseValue={0} stroke="none"
            fill={`url(#${fillId})`} fillOpacity={1} dot={false}
            activeDot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div> : <p className="flex min-h-24 items-center justify-center text-center text-sm text-muted">{t("No scoring events recorded.")}</p>}
  </section>;
}
