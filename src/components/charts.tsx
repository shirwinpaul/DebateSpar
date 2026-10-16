"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* Single-series charts: one validated colour (--chart), recessive grid, hover tooltips, plus a data table for accessibility. */

const axisTick = { fill: "var(--fg-muted)", fontSize: 12 };
const tooltipStyle = {
  contentStyle: { background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--fg)" },
  labelStyle: { color: "var(--fg)", fontWeight: 600 },
  itemStyle: { color: "var(--fg)" },
};

function DataTable({ caption, rows, unit }: { caption: string; rows: { label: string; value: number }[]; unit: string }) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-muted">Show as table</summary>
      <table className="mt-2 w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-muted"><th className="py-1">Item</th><th className="py-1">{unit}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-line"><td className="py-1 capitalize">{r.label}</td><td className="py-1">{r.value}</td></tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

export function SkillRadar({ data, title }: { data: { skill: string; score: number }[]; title: string }) {
  return (
    <figure>
      <figcaption className="mb-2 font-semibold">{title}</figcaption>
      <div className="h-72 w-full" role="img" aria-label={`${title}: ${data.map((d) => `${d.skill} ${d.score}`).join(", ")}`}>
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="skill" tick={{ ...axisTick, textTransform: "capitalize" } as object} />
            <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} axisLine={false} />
            <Radar dataKey="score" name="Score" stroke="var(--chart)" strokeWidth={2} fill="var(--chart)" fillOpacity={0.3} dot={{ r: 4, fill: "var(--chart)" }} />
            <Tooltip {...tooltipStyle} formatter={(v) => [`${v} / 10`, "Score"]} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption={title} rows={data.map((d) => ({ label: d.skill, value: d.score }))} unit="Score (0–10)" />
    </figure>
  );
}

export function ScoreLine({ data, title, yMax, unit }: { data: { label: string; value: number }[]; title: string; yMax: number; unit: string }) {
  return (
    <figure>
      <figcaption className="mb-2 font-semibold">{title}</figcaption>
      <div className="h-60 w-full" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} stroke="var(--border)" />
            <YAxis domain={[0, yMax]} tick={axisTick} stroke="var(--border)" />
            <Tooltip {...tooltipStyle} cursor={{ stroke: "var(--fg-muted)", strokeDasharray: "3 3" }} formatter={(v) => [v, unit]} />
            <Line type="monotone" dataKey="value" name={unit} stroke="var(--chart)" strokeWidth={2} dot={{ r: 4, fill: "var(--chart)", stroke: "var(--bg-elev)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption={title} rows={data} unit={unit} />
    </figure>
  );
}

export function SkillBars({ data, title }: { data: { skill: string; score: number }[]; title: string }) {
  return (
    <figure>
      <figcaption className="mb-2 font-semibold">{title}</figcaption>
      <div className="h-64 w-full" role="img" aria-label={`${title}: ${data.map((d) => `${d.skill} ${d.score}`).join(", ")}`}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 10]} tick={axisTick} stroke="var(--border)" />
            <YAxis type="category" dataKey="skill" tick={axisTick} stroke="var(--border)" width={84} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "var(--bg-elev-2)" }} formatter={(v) => [`${v} / 10`, "Average"]} />
            <Bar dataKey="score" fill="var(--chart)" radius={[0, 4, 4, 0]} barSize={16} label={{ position: "right", fill: "var(--fg)", fontSize: 12 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption={title} rows={data.map((d) => ({ label: d.skill, value: d.score }))} unit="Average (0–10)" />
    </figure>
  );
}
