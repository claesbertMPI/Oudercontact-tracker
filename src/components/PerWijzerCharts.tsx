// src/components/PerWijzerCharts.tsx
"use client";

import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  LabelList,
} from "recharts";

interface KlasStats {
  klas: string;       // bv. "ROWA"
  percentage: number; // bv. 85
}
interface WijzerStats {
  wijzer: string;     // bv. "ROW"
  percentage: number; // bv. 87  (totaal % voor ROW)
}

type Props = {
  perKlas: KlasStats[];
  perWijzer: WijzerStats[];
};

export default function PerWijzerCharts({ perKlas, perWijzer }: Props) {
  return (
    <div className="space-y-8">
      {perWijzer.map((w) => {
        // 1) filter alle klassen voor deze wijzer
        const klasData = perKlas
          .filter((k) => k.klas.startsWith(w.wijzer))
          .map((k) => ({ klas: k.klas, percentage: k.percentage }));

        // 2) voeg één extra datapunt toe voor de wijzer zelf
        const data = [
          ...klasData,
          { klas: `${w.wijzer} (totaal)`, percentage: w.percentage },
        ];

        return (
          <div key={w.wijzer}>
            <h3 className="text-lg font-semibold mb-2">Wijzer {w.wijzer}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <XAxis dataKey="klas" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="percentage" fill="#3182CE">
                  <LabelList
                    dataKey="percentage"
                    position="top"
                    formatter={(v: number) => `${v}%`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
