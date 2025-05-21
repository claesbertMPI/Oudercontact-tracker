"use client";

import { useState, useTransition } from "react";

export default function ChecklistClient({ oudercontact, leerlingen, aanwezigheden }: any) {
  const [filterKlas, setFilterKlas] = useState("");
  const [isPending, startTransition] = useTransition();

  const aanwezigPerStudent: Record<number, { present: boolean; comment: string }> = {};
  aanwezigheden.forEach((a: any) => {
    aanwezigPerStudent[a.studentId] = { present: a.present, comment: a.comment || "" };
  });

  const klassen = Array.from(new Set(leerlingen.map((l: any) => l.class))).sort();

  const gefilterd = filterKlas ? leerlingen.filter((l: any) => l.class === filterKlas) : leerlingen;

  const handleUpdate = (studentId: number, present: boolean, comment: string) => {
    startTransition(async () => {
      await fetch(`/api/checklist/${oudercontact.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, present, comment }),
      });
    });
  };

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Checklist: {oudercontact.title} ({oudercontact.schoolYear})
      </h1>

      <div className="mb-4">
        <label className="mr-2 font-medium">Filter op klas:</label>
        <select
          value={filterKlas}
          onChange={(e) => setFilterKlas(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Alle klassen</option>
          {klassen.map((klas) => (
            <option key={klas} value={klas}>{klas}</option>
          ))}
        </select>
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Klas</th>
            <th className="border p-2">Naam</th>
            <th className="border p-2">Aanwezig</th>
            <th className="border p-2">Opmerking</th>
          </tr>
        </thead>
        <tbody>
          {gefilterd.map((leerling: any) => {
            const info = aanwezigPerStudent[leerling.id] || { present: false, comment: "" };

            return (
              <tr key={leerling.id}>
                <td className="border p-2">{leerling.class}</td>
                <td className="border p-2">{leerling.firstName} {leerling.lastName}</td>
                <td className="border p-2 text-center">
                  <input
                    type="checkbox"
                    defaultChecked={info.present}
                    onChange={(e) => handleUpdate(leerling.id, e.target.checked, info.comment)}
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    defaultValue={info.comment}
                    onBlur={(e) => handleUpdate(leerling.id, info.present, e.target.value)}
                    className="w-full border rounded p-1"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isPending && <p className="mt-4 text-blue-600">⏳ Aan het opslaan...</p>}
    </main>
  );
}
