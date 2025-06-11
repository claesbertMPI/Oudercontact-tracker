// src/components/StatistiekGrafiek.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

type GrafiekData = {
  klas: string;
  percentage: number;
};

export default function StatistiekGrafiek({ data }: { data: GrafiekData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="klas" />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(value: number) => `${value}%`} />
        <Bar dataKey="percentage" fill="#3182CE">
          <LabelList
            dataKey="percentage"
            position="top"
            formatter={(v: number) => `${v}%`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
