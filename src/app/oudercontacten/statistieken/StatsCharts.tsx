"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as React from "react";

export type SeriesItem = {
  label: string;
  totaal: number;
  fysiekAanwezig: number;
  telefonischOnline: number;
  afwezig: number;
  opvangGebruikt: number;
};

type TooltipRow = SeriesItem;
type TooltipPayload<T> = { payload: T }[];
type TooltipProps<T> = { active?: boolean; payload?: TooltipPayload<T>; label?: string | number };

export default function StatsCharts({
  klas,
  stroom,
  totaal,
  maxBars = 14,
}: {
  klas: SeriesItem[];
  stroom: SeriesItem[];
  totaal: { totaal: number; fysiekAanwezig: number; telefonischOnline: number; afwezig: number; opvangGebruikt: number; present: number };
  maxBars?: number;
}) {
  const COLORS = {
    fysiek: "#2563eb",
    tel: "#22c55e",
    afw: "#ef4444",
    opvang: "#f59e0b",
  };

  // modus: absolute aantallen of percentages (excl. Opvang)
  const [mode, setMode] = React.useState<"abs" | "pct">("abs");

  const trunc = (arr: SeriesItem[]) => arr.slice(0, maxBars);

  // normaliseer naar % over (fysiek + tel + afwezig), excl. opvang
  const toPct = (arr: SeriesItem[]): SeriesItem[] =>
    arr.map((r) => {
      const denom = r.fysiekAanwezig + r.telefonischOnline + r.afwezig;
      if (denom <= 0) {
        return { ...r, fysiekAanwezig: 0, telefonischOnline: 0, afwezig: 0 }; // opvang niet meegenomen
      }
      return {
        ...r,
        fysiekAanwezig: (r.fysiekAanwezig / denom) * 100,
        telefonischOnline: (r.telefonischOnline / denom) * 100,
        afwezig: (r.afwezig / denom) * 100,
      };
    });

  const klasDataAbs = React.useMemo(() => trunc(klas), [klas, maxBars]);
  const stroomDataAbs = React.useMemo(() => trunc(stroom), [stroom, maxBars]);
  const klasDataPct = React.useMemo(() => toPct(trunc(klas)), [klas, maxBars]);
  const stroomDataPct = React.useMemo(() => toPct(trunc(stroom)), [stroom, maxBars]);

  // Pie: altijd zonder opvang (niet meegerekend)
  const pieData = [
    { name: "Fysiek", value: totaal.fysiekAanwezig, color: COLORS.fysiek },
    { name: "Tel/online", value: totaal.telefonischOnline, color: COLORS.tel },
    { name: "Afwezig", value: totaal.afwezig, color: COLORS.afw },
  ];

  function valuePct(value: number, total: number) {
    if (!total) return "0 (0%)";
    const p = Math.round((value / total) * 100);
    return `${value} (${p}%)`;
  }

  const renderTooltip =
    (labelKey: "label", modeLocal: "abs" | "pct") =>
    ({ active, payload, label }: TooltipProps<TooltipRow>) => {
      if (!active || !payload || !payload.length) return null;
      const row = payload[0].payload as TooltipRow;
      const denom = Math.max(0, row.totaal - row.opvangGebruikt); // excl. opvang
      const F = row.fysiekAanwezig;
      const T = row.telefonischOnline;
      const A = row.afwezig;

      const fmt = (val: number, _raw: number) =>
        modeLocal === "abs" ? val : `${Math.round(val)}%`;

      return (
        <div className="rounded border bg-white p-2 text-sm shadow">
          <div className="font-medium mb-1">{label}</div>
          <div className="mb-1">
            Totaal: <strong>{row.totaal}</strong> • Denom (excl. Opvang):{" "}
            <strong>{denom}</strong>
          </div>
          <div style={{ color: COLORS.fysiek }}>
            Fysiek: <strong>{fmt(F, row.fysiekAanwezig)}</strong>
          </div>
          <div style={{ color: COLORS.tel }}>
            Tel/online: <strong>{fmt(T, row.telefonischOnline)}</strong>
          </div>
          <div style={{ color: COLORS.afw }}>
            Afwezig: <strong>{fmt(A, row.afwezig)}</strong>
          </div>
          {modeLocal === "abs" && (
            <div style={{ color: COLORS.opvang }}>
              Opvang (niet meegerekend):{" "}
              <strong>{row.opvangGebruikt}</strong>
            </div>
          )}
        </div>
      );
    };

  const barCommon = {
    margin: { left: 8, right: 8 },
  };

  return (
    <div className="space-y-8">
      {/* modus-toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">Grafiekmodus</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "abs" | "pct")}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="abs">Absoluut</option>
          <option value="pct">Percentage (excl. Opvang)</option>
        </select>
      </div>

      {/* Totaal: donut/pie — opvang niet meegerekend */}
      <div className="rounded border p-4">
        <h3 className="font-medium mb-3">Verdeling totaal (excl. Opvang)</h3>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {pieData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: unknown, name: unknown) => {
                  const v = typeof val === "number" ? val : 0;
                  const denom = totaal.fysiekAanwezig + totaal.telefonischOnline + totaal.afwezig;
                  const p = denom ? Math.round((v / denom) * 100) : 0;
                  return [`${v} (${p}%)`, String(name)];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stacked bar per klas */}
      <div className="rounded border p-4">
        <h3 className="font-medium mb-1">
          Per klas {mode === "pct" && <span className="text-slate-500 text-sm">(percentages excl. Opvang)</span>}
        </h3>
        <div className="w-full" style={{ height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={mode === "abs" ? klasDataAbs : klasDataPct} {...barCommon}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis
                allowDecimals={false}
                domain={mode === "pct" ? [0, 100] : undefined}
                tickFormatter={(v) => (mode === "pct" ? `${v}%` : String(v))}
              />
              <Tooltip content={renderTooltip("label", mode)} />
              <Legend />
              {/* ABS: alle 4; PCT: alleen F/T/A */}
              <Bar dataKey="fysiekAanwezig" stackId="a" name="Fysiek" fill={COLORS.fysiek} />
              <Bar dataKey="telefonischOnline" stackId="a" name="Tel/online" fill={COLORS.tel} />
              <Bar dataKey="afwezig" stackId="a" name="Afwezig" fill={COLORS.afw} />
              {mode === "abs" && (
                <Bar dataKey="opvangGebruikt" stackId="a" name="Opvang (niet meegerekend)" fill={COLORS.opvang} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stacked bar per stroom */}
      <div className="rounded border p-4">
        <h3 className="font-medium mb-1">
          Per stroom {mode === "pct" && <span className="text-slate-500 text-sm">(percentages excl. Opvang)</span>}
        </h3>
        <div className="w-full" style={{ height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={mode === "abs" ? stroomDataAbs : stroomDataPct} {...barCommon}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" interval={0} />
              <YAxis
                allowDecimals={false}
                domain={mode === "pct" ? [0, 100] : undefined}
                tickFormatter={(v) => (mode === "pct" ? `${v}%` : String(v))}
              />
              <Tooltip content={renderTooltip("label", mode)} />
              <Legend />
              <Bar dataKey="fysiekAanwezig" stackId="b" name="Fysiek" fill={COLORS.fysiek} />
              <Bar dataKey="telefonischOnline" stackId="b" name="Tel/online" fill={COLORS.tel} />
              <Bar dataKey="afwezig" stackId="b" name="Afwezig" fill={COLORS.afw} />
              {mode === "abs" && (
                <Bar dataKey="opvangGebruikt" stackId="b" name="Opvang (niet meegerekend)" fill={COLORS.opvang} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
