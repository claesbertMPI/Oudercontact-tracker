"use client";

import { useEffect, useState, useTransition } from "react";

export default function ChecklistClient({
  oudercontact,
  leerlingen,
  aanwezigheden,
}: {
  oudercontact: {
    id: number;
    title: string;
    schoolYear: string;
    dateString?: string; // meegegeven als string vanuit page.tsx
  };
  leerlingen: {
    id: number;
    firstName: string;
    lastName: string;
    class: string;
  }[];
  aanwezigheden: {
    studentId: number;
    present: boolean;
    comment: string | null;
  }[];
}) {
  const [filterKlas, setFilterKlas] = useState("");
  const [isPending, startTransition] = useTransition();

  const klassen = Array.from(new Set(leerlingen.map((l) => l.class))).sort();

  const [aanwezigPerStudent, setAanwezigPerStudent] = useState<
    Record<number, { present: boolean; comment: string }>
  >({});

  useEffect(() => {
    const init: Record<number, { present: boolean; comment: string }> = {};
    leerlingen.forEach((l) => {
      const info = aanwezigheden.find((a) => a.studentId === l.id);
      init[l.id] = {
        present: info?.present ?? false,
        comment: info?.comment ?? "",
      };
    });
    setAanwezigPerStudent(init);
  }, [leerlingen, aanwezigheden]);

  const gefilterd = filterKlas
    ? leerlingen.filter((l) => l.class === filterKlas)
    : leerlingen;

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
      <h1 className="text-2xl font-bold mb-2">
        Checklist: {oudercontact.title} ({oudercontact.schoolYear})
      </h1>
      <p className="text-gray-600 mb-6">
        📅 {new Date(oudercontact.dateString ?? "").toLocaleDateString("nl-BE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="mb-4">
        <label className="mr-2 font-medium">Filter op klas:</label>
        <select
          value={filterKlas}
          onChange={(e) => setFilterKlas(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Alle klassen</option>
          {klassen.map((klas) => (
            <option key={klas} value={klas}>
              {klas}
            </option>
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
          {gefilterd.map((leerling) => {
            const info = aanwezigPerStudent[leerling.id] ?? {
              present: false,
              comment: "",
            };

            return (
              <tr key={leerling.id}>
                <td className="border p-2">{leerling.class}</td>
                <td className="border p-2">
                  {leerling.firstName} {leerling.lastName}
                </td>
                <td className="border p-2 text-center">
                  <input
                    type="checkbox"
                    checked={info.present}
                    onChange={(e) => {
                      const newPresent = e.target.checked;
                      const comment = info.comment;
                      setAanwezigPerStudent((prev) => ({
                        ...prev,
                        [leerling.id]: { present: newPresent, comment },
                      }));
                      handleUpdate(leerling.id, newPresent, comment);
                    }}
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    value={info.comment}
                    onChange={(e) => {
                      const comment = e.target.value;
                      const present = info.present;
                      setAanwezigPerStudent((prev) => ({
                        ...prev,
                        [leerling.id]: { present, comment },
                      }));
                    }}
                    onBlur={() =>
                      handleUpdate(leerling.id, info.present, info.comment)
                    }
                    className="w-full border rounded p-1"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isPending && <p className="mt-4 text-blue-600">💾 Bezig met opslaan...</p>}
    </main>
  );
}
