import { prisma } from "@/lib/prisma";

type Stat = {
  totaal: number;
  fysiekAanwezig: number;
  telefonischOnline: number;
  afwezig: number;
  opvangGebruikt: number;
  present: number;
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const oudercontactId = Number(id);

  // Data ophalen
  const [leerlingen, rows] = await Promise.all([
    prisma.student.findMany({
      select: { id: true, class: { select: { code: true } } },
    }),
    prisma.attendance.findMany({
      where: { oudercontactId },
      select: {
        studentId: true,
        fysiekAanwezig: true,
        telefonischOnline: true,
        afwezig: true,
        opvangGebruikt: true,
      },
    }),
  ]);

  // Map met genormaliseerde flags
  const byStudent = new Map<number, {
    fysiekAanwezig: boolean;
    telefonischOnline: boolean;
    afwezig: boolean;
    opvangGebruikt: boolean;
  }>();
  for (const r of rows) {
    let f = !!r.fysiekAanwezig;
    let t = !!r.telefonischOnline;
    let a = !!r.afwezig;
    if (a) { f = false; t = false; }
    else if (f) { t = false; }
    byStudent.set(r.studentId, {
      fysiekAanwezig: f,
      telefonischOnline: t,
      afwezig: a,
      opvangGebruikt: !!r.opvangGebruikt,
    });
  }

  const empty = (): Stat => ({
    totaal: 0,
    fysiekAanwezig: 0,
    telefonischOnline: 0,
    afwezig: 0,
    opvangGebruikt: 0,
    present: 0,
  });

  const perKlas: Record<string, Stat> = Object.create(null);
  const perWijzer: Record<string, Stat> = Object.create(null);
  const totaal: Stat = empty();

  for (const l of leerlingen) {
    const code = l.class?.code?.toUpperCase() ?? "—";
    const wijzer = code.slice(0, 3);
    perKlas[code] ??= empty();
    perWijzer[wijzer] ??= empty();

    const flags = byStudent.get(l.id) ?? {
      fysiekAanwezig: false,
      telefonischOnline: false,
      afwezig: false,
      opvangGebruikt: false,
    };
    const present = flags.fysiekAanwezig || flags.telefonischOnline;

    const bump = (s: Stat) => {
      s.totaal += 1;
      s.fysiekAanwezig += flags.fysiekAanwezig ? 1 : 0;
      s.telefonischOnline += flags.telefonischOnline ? 1 : 0;
      s.afwezig += flags.afwezig ? 1 : 0;
      s.opvangGebruikt += flags.opvangGebruikt ? 1 : 0;
      s.present += present ? 1 : 0;
    };

    bump(totaal);
    bump(perKlas[code]);
    bump(perWijzer[wijzer]);
  }

  const klasEntries = Object.entries(perKlas).sort((a, b) => a[0].localeCompare(b[0]));
  const wijzerEntries = Object.entries(perWijzer).sort((a, b) => a[0].localeCompare(b[0]));

  const Th = ({ children }: { children: React.ReactNode }) => (
    <th className="p-2 text-right font-medium">{children}</th>
  );

  const renderTable = (title: string, rows: [string, Stat][]) => (
    <section>
      <h2 className="font-medium mb-2">{title}</h2>
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="p-2 text-left font-medium">Groep</th>
              <Th>Totaal</Th>
              <Th>Fysiek</Th>
              <Th>Tel/online</Th>
              <Th>Afwezig</Th>
              <Th>Opvang</Th>
              <Th>Present (Fysiek∪Tel)</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(([label, s]) => (
              <tr key={label}>
                <td className="p-2">{label}</td>
                <td className="p-2 text-right">{s.totaal}</td>
                <td className="p-2 text-right">{s.fysiekAanwezig}</td>
                <td className="p-2 text-right">{s.telefonischOnline}</td>
                <td className="p-2 text-right">{s.afwezig}</td>
                <td className="p-2 text-right">{s.opvangGebruikt}</td>
                <td className="p-2 text-right">{s.present}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/60">
            <tr>
              <td className="p-2 font-medium">Totaal</td>
              <td className="p-2 text-right">{totaal.totaal}</td>
              <td className="p-2 text-right">{totaal.fysiekAanwezig}</td>
              <td className="p-2 text-right">{totaal.telefonischOnline}</td>
              <td className="p-2 text-right">{totaal.afwezig}</td>
              <td className="p-2 text-right">{totaal.opvangGebruikt}</td>
              <td className="p-2 text-right">{totaal.present}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-xl font-semibold">Statistieken</h1>
      {renderTable("Per klas", klasEntries)}
      {renderTable("Per wijzer", wijzerEntries)}
    </div>
  );
}
