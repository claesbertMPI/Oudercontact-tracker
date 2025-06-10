"use client";

import { useEffect, useState, useTransition } from "react";

type OC = {
  id: number;
  title: string;
  date: string;
  schoolYear: string;
};

type StatistiekPerGroep = {
  klas?: string;
  wijzer?: string;
  totaal: number;
  aanwezig: number;
  percentage: number;
};

type StatistiekData = {
  perKlas: StatistiekPerGroep[];
  perWijzer: StatistiekPerGroep[];
};

export default function StatistiekenDashboard() {
  const [oudercontacten, setOudercontacten] = useState<OC[]>([]);
  const [geselecteerdId, setGeselecteerdId] = useState<number | null>(null);
  const [statistiekData, setStatistiekData] = useState<StatistiekData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/oudercontacten")
      .then((res) => res.json())
      .then(setOudercontacten);
  }, []);

  useEffect(() => {
    if (!geselecteerdId) return;
    startTransition(() => {
      fetch(`/api/statistieken/${geselecteerdId}`)
        .then((res) => res.json())
        .then((data: StatistiekData) => setStatistiekData(data));
    });
  }, [geselecteerdId]);

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">📊 Statistieken per oudercontact</h1>

      <div>
        <label className="font-medium mr-2">Kies een oudercontact:</label>
        <select
          value={geselecteerdId ?? ""}
          onChange={(e) => setGeselecteerdId(Number(e.target.value))}
          className="border px-2 py-1 rounded"
        >
          <option value="">-- Selecteer --</option>
          {oudercontacten.map((oc) => (
            <option key={oc.id} value={oc.id}>
              {oc.title} ({oc.schoolYear}) – {new Date(oc.date).toLocaleDateString("nl-BE")}
            </option>
          ))}
        </select>
      </div>

      {isPending && <p>⏳ Bezig met laden...</p>}

      {statistiekData && (
        <>
          <h2 className="text-xl font-bold mt-6 mb-2">Per klas</h2>
          <table className="w-full border-collapse border border-gray-300 mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Klas</th>
                <th className="border p-2 text-right">Aanwezig</th>
                <th className="border p-2 text-right">Totaal</th>
                <th className="border p-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {statistiekData.perKlas.map((item) => (
                <tr key={item.klas}>
                  <td className="border p-2">{item.klas}</td>
                  <td className="border p-2 text-right">{item.aanwezig}</td>
                  <td className="border p-2 text-right">{item.totaal}</td>
                  <td className="border p-2 text-right">{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="text-xl font-bold mb-2">Per wijzer</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Wijzer</th>
                <th className="border p-2 text-right">Aanwezig</th>
                <th className="border p-2 text-right">Totaal</th>
                <th className="border p-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {statistiekData.perWijzer.map((item) => (
                <tr key={item.wijzer}>
                  <td className="border p-2">{item.wijzer}</td>
                  <td className="border p-2 text-right">{item.aanwezig}</td>
                  <td className="border p-2 text-right">{item.totaal}</td>
                  <td className="border p-2 text-right">{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
