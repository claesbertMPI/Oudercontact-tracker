// src/components/WijzerGroupedChart.tsx
"use client";

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

export default function WijzerGroupedChart({ perKlas, perWijzer }: Props) {
  // 1) Bouw een map per wijzer met klas-percentages en het wijzer-totaal
  const map: Record<string, { klasValues: Record<string, number>; totaal: number }> = {};

  // Zet eerst de totaals
  perWijzer.forEach((w) => {
    map[w.wijzer] = { klasValues: {}, totaal: w.percentage };
  });

  // Vul per klas in
  perKlas.forEach((k) => {
    const wijzer = k.klas.slice(0, 3);
    if (!map[wijzer]) {
      map[wijzer] = { klasValues: {}, totaal: 0 };
    }
    map[wijzer].klasValues[k.klas] = k.percentage;
  });

  // 2) Zet om naar een array voor de chart
  const data = Object.entries(map).map(([wijzer, { klasValues, totaal }]) => ({
    wijzer,
    ...klasValues,
    totaal,
  }));

  // 3) Vind alle unieke klassennamen om dynamisch Bars te renderen
  const allKlassen = Array.from(new Set(perKlas.map((k) => k.klas))).sort();

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <XAxis dataKey="wijzer" />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(value: number) => `${value}%`} />
        <Legend />

        {/* 4) Bars per klas */}
        {allKlassen.map((klas) => (
          <Bar
            key={klas}
            dataKey={klas}
            name={klas}
            stackId={klas} // voorkomt dat klassendiagrammen overlappen (aanpassen naar wens)
          />
        ))}

        {/* 5) Extra balk voor het wijzer-totaal */}
        <Bar
          dataKey="totaal"
          name="Wijzer-totaal"
          fill="#333"     // contrasterende kleur
          barSize={30}    // optioneel: bredere balk
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
