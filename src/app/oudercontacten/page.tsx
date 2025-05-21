import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function OudercontactenOverzichtPage() {
  const oudercontacten = await prisma.oudercontact.findMany({
    orderBy: { date: "desc" },
  });

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📅 Overzicht oudercontacten</h1>
      <ul className="space-y-3">
        {oudercontacten.map((oc) => (
          <li key={oc.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <strong>{oc.title}</strong> ({oc.schoolYear}) –{" "}
              {new Date(oc.date).toLocaleDateString("nl-BE")}
            </div>
            <Link
              href={`/oudercontacten/${oc.id}`}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Checklist
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
