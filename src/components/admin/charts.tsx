"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PALETTE = ["#ff6b1a", "#2fd9ff", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#64748b"];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--foreground)",
  fontSize: "12px",
};

function fmt(n: number) {
  return "Rs " + n.toLocaleString("en-PK");
}

export function SalesTrendChart({ data }: { data: { date: string; pos: number; online: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6b1a" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#ff6b1a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gOnline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2fd9ff" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#2fd9ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => fmt(Number(value))} />
        <Area type="monotone" dataKey="online" stackId="1" stroke="#2fd9ff" fill="url(#gOnline)" strokeWidth={2} name="Online" />
        <Area type="monotone" dataKey="pos" stackId="1" stroke="#ff6b1a" fill="url(#gPos)" strokeWidth={2} name="POS" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
        <YAxis type="category" dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} formatter={(value) => fmt(Number(value))} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Sales">
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">No data yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} stroke="var(--card)" strokeWidth={2}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => fmt(Number(value))} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ChartLegend({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <ul className="flex flex-col gap-2">
      {data.map((d, i) => (
        <li key={d.name} className="flex items-center gap-2 text-sm">
          <span className="size-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
          <span className="flex-1 text-muted-foreground">{d.name}</span>
          <span className="font-medium">{Math.round((d.value / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}
