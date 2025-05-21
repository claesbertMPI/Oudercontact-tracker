import { prisma } from "@/lib/prisma";

export default async function LeerlingenPage() {
  const leerlingen = await prisma.student.findMany({
    orderBy: [
      { class: "asc" },
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📋 Leerlingenlijst</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Klas</th>
            <th className="border p-2 text-left">Naam</th>
          </tr>
        </thead>
        <tbody>
          {leerlingen.map((leerling) => (
            <tr key={leerling.id}>
              <td className="border p-2">{leerling.class}</td>
              <td className="border p-2">
                {leerling.firstName} {leerling.lastName}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
