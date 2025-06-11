// src/app/oudercontacten/[id]/statistieken/page.tsx

import { prisma } from "@/lib/prisma";
import StatistiekGrafiek from "@/components/StatistiekGrafiek";

export default async function StatistiekPage(_props: unknown) {
  // Cast om binding-element 'params' van type any te vermijden
  const { params } = _props as { params: { id: string } };
  const oudercontactId = parseInt(params.id, 10);

  if (isNaN(oudercontactId)) {
    return (
      <div className="p-8 text-red-600">
        ❌ Ongeldig oudercontact-ID: <code>{params.id}</code>
      </div>
    );
  }

  // Haal alle leerlingen én aanwezigen op voor dit oudercontact
  const leerlingen = await prisma.student.findMany();
  const aanwezigheden = await prisma.attendance.findMany({
    where: { oudercontactId },
  });

  // Bouw per-klas en per-wijzer statistieken
  const perKlas: Record<string, { totaal: number; aanwezig: number }> = {};
  const perWijzer: Record<string, { totaal: number; aanwezig: number }> = {};

  for (const leerling of leerlingen) {
    const klas = leerling.class;
    const wijzer = klas.slice(0, 3);

    perKlas[klas] ??= { totaal: 0, aanwezig: 0 };
    perWijzer[wijzer] ??= { totaal: 0, aanwezig: 0 };

    perKlas[klas].totaal++;
    perWijzer[wijzer].totaal++;

    if (aanwezigheden.some((a) => a.studentId === leerling.id && a.present)) {
      perKlas[klas].aanwezig++;
      perWijzer[wijzer].aanwezig++;
    }
  }

  // Transformeer naar arrays met percentages
  const klasData = Object.entries(perKlas).map(([klas, stats]) => ({
    klas,
    ...stats,
    percentage: stats.totaal
      ? Math.round((stats.aanwezig / stats.totaal) * 100)
      : 0,
  }));

  const wijzerData = Object.entries(perWijzer).map(([wijzer, stats]) => ({
    wijzer,
    ...stats,
    percentage: stats.totaal
      ? Math.round((stats.aanwezig / stats.totaal) * 100)
      : 0,
  }));

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📊 Statistiek per klas</h1>

      <table className="w-full border-collapse border border-gray-300 mb-8">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Klas</th>
            <th className="border p-2 text-right">Aanwezig</th>
            <th className="border p-2 text-right">Totaal</th>
            <th className="border p-2 text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {klasData.map(({ klas, aanwezig, totaal, percentage }) => (
            <tr key={klas}>
              <td className="border p-2">{klas}</td>
              <td className="border p-2 text-right">{aanwezig}</td>
              <td className="border p-2 text-right">{totaal}</td>
              <td className="border p-2 text-right">{percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-bold mb-4">📈 Aanwezigheid per klas (%)</h2>
      <StatistiekGrafiek
        data={klasData.map(({ klas, percentage }) => ({ klas, percentage }))}
      />

      <h2 className="text-xl font-bold mt-10 mb-4">🧭 Samenvatting per wijzer</h2>
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
          {wijzerData.map(({ wijzer, aanwezig, totaal, percentage }) => (
            <tr key={wijzer}>
              <td className="border p-2">{wijzer}</td>
              <td className="border p-2 text-right">{aanwezig}</td>
              <td className="border p-2 text-right">{totaal}</td>
              <td className="border p-2 text-right">{percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
