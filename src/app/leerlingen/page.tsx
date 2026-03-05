import { prisma } from "@/lib/prisma";

export default async function Page() {
  const leerlingen = await prisma.student.findMany({
    orderBy: [
      { class: { code: "asc" } }, // ✅ relation ordering
      { lastName: "asc" },
      { firstName: "asc" },
    ],
    include: {
      class: { select: { id: true, code: true, naam: true } }, // handig voor de UI
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold mb-4">Leerlingen</h1>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2">Klas</th>
            <th className="text-left p-2">Naam</th>
          </tr>
        </thead>
        <tbody>
          {leerlingen.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="p-2">
                <span className="font-medium">{l.class?.code ?? "—"}</span>
                {l.class?.naam &&
                  l.class.naam.trim().toUpperCase() !== (l.class.code ?? "").toUpperCase() && (
                    <span className="ml-1 text-xs text-slate-500">— {l.class.naam}</span>
                  )}
              </td>
              <td className="p-2">
                {l.lastName} {l.firstName}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
