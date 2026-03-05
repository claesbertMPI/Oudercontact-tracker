import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SchoolYearFilter from "./SchoolYearFilter";

const DEFAULT_YEAR = "2025-2026";

export default async function OudercontactenOverzichtPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sjParam = Array.isArray(sp.sj) ? sp.sj[0] : sp.sj;

  // Alle beschikbare schooljaren ophalen (distinct)
  const yearsRaw = await prisma.oudercontact.findMany({
    select: { schoolYear: true },
    distinct: ["schoolYear"],
    orderBy: { schoolYear: "desc" },
  });
  const years = yearsRaw.map(y => y.schoolYear).filter(Boolean) as string[];

  // Gekozen jaar = queryparam of default (en als default niet in DB zit, pak de eerste)
  let selectedYear = sjParam || DEFAULT_YEAR;
  if (years.length && !years.includes(selectedYear)) {
    selectedYear = years[0]!;
  }

  // Oudercontacten voor gekozen jaar
  const oudercontacten = await prisma.oudercontact.findMany({
    where: { schoolYear: selectedYear },
    orderBy: { date: "desc" },
  });

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Overzicht oudercontacten</h1>

      <div className="flex items-center gap-3">
        <label htmlFor="sj" className="text-sm text-slate-600">
          Schooljaar
        </label>
        <SchoolYearFilter id="sj" years={years} value={selectedYear} />
      </div>

      <ul className="space-y-3">
        {oudercontacten.map((oc) => (
          <li key={oc.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <strong>{oc.title}</strong> ({oc.schoolYear}){" "}
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
        {oudercontacten.length === 0 && (
          <li className="text-slate-500 text-sm">Geen oudercontacten voor {selectedYear}.</li>
        )}
      </ul>
    </main>
  );
}
