// src/app/oudercontacten/statistieken/page.tsx
import { prisma } from "@/lib/prisma";
import StatsCharts, { SeriesItem } from "./StatsCharts";


type Stat = {
  totaal: number;
  fysiekAanwezig: number;
  telefonischOnline: number;
  afwezig: number;
  opvangGebruikt: number;
  present: number; // fysiek || tel/online
};

type AttendanceRow = {
  studentId: number;
  fysiekAanwezig: boolean;
  telefonischOnline: boolean;
  afwezig: boolean;
  opvangGebruikt: boolean;
};

// Bepaal de 'stroom' uit een klascode.
// Regel: alles vóór de eerste 'I' of 'G' (case-insensitive).
// Uitzondering: KO1 hoort bij de K-stroom.
function stroomFrom(codeRaw: string | null | undefined): string {
  const code = (codeRaw ?? "").toUpperCase().trim();
  if (!code) return "—";

  // Uitzondering
  if (/^KO1/.test(code)) return "K";

  // Standaardregel: stuk voor eerste I of G
  const m = code.match(/^(.*?)[IG]/i);
  if (m && m[1] !== undefined) {
    const head = m[1].toUpperCase();
    return head.length ? head : code[0] ?? "—";
  }

  // Fallback: neem letters tot eerste cijfer
  const m2 = code.match(/^[A-Z]+/);
  return (m2?.[0] ?? code) || "—";
}

function fmtCountPct(n: number, d: number): string {
  if (!d) return "0 (0%)";
  const p = Math.round((n / d) * 100);
  return `${n} (${p}%)`;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ocParam = Array.isArray(sp.oc) ? sp.oc[0] : sp.oc;
  const oudercontactId = ocParam ? Number(ocParam) : undefined;

  // Dropdown-opties
  const ocOptions = await prisma.oudercontact.findMany({
    orderBy: { date: "desc" },
    select: { id: true, title: true, date: true, schoolYear: true },
  });

  // Data ophalen
  const [leerlingen, rows] = await Promise.all([
    prisma.student.findMany({
      select: { id: true, class: { select: { code: true } } },
    }),
    oudercontactId
      ? prisma.attendance.findMany({
          where: { oudercontactId },
          select: {
            studentId: true,
            fysiekAanwezig: true,
            telefonischOnline: true,
            afwezig: true,
            opvangGebruikt: true,
          },
        })
      : Promise.resolve([] as AttendanceRow[]),
  ]);

  // Genormaliseerde flags per student
  const byStudent = new Map<
    number,
    {
      fysiekAanwezig: boolean;
      telefonischOnline: boolean;
      afwezig: boolean;
      opvangGebruikt: boolean;
    }
  >();
  for (const r of rows) {
    let f = !!r.fysiekAanwezig;
    let t = !!r.telefonischOnline;
    const a = !!r.afwezig;
    if (a) {
      f = false;
      t = false;
    } else if (f) {
      t = false;
    }
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
  const perStroom: Record<string, Stat> = Object.create(null);
  const totaal: Stat = empty();

  for (const l of leerlingen) {
    const code = (l.class?.code ?? "—").toUpperCase();
    const stroom = stroomFrom(code);

    perKlas[code] ??= empty();
    perStroom[stroom] ??= empty();

    const flags =
      byStudent.get(l.id) ?? {
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
    bump(perStroom[stroom]);
  }

  const klasEntries = Object.entries(perKlas).sort((a, b) => a[0].localeCompare(b[0]));
  const stroomEntries = Object.entries(perStroom).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-xl font-semibold">Statistieken</h1>

      {/* Eenvoudige server form (geen client JS nodig) */}
      <form action="/oudercontacten/statistieken" className="flex items-end gap-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Oudercontact</label>
          <select name="oc" defaultValue={oudercontactId ?? ""} className="border rounded px-2 py-1">
            <option value="">Alle leerlingen</option>
            {ocOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title} ({o.schoolYear}) — {new Date(o.date).toLocaleDateString("nl-BE")}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-9 bg-blue-600 text-white px-3 rounded text-sm hover:bg-blue-700"
        >
          Toon
        </button>
      </form>

      {/* Per klas */}
      <section>
        <h2 className="font-medium mb-2">Per klas</h2>
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-2 text-left font-medium">Klas</th>
                <th className="p-2 text-right font-medium">Totaal</th>
                <th className="p-2 text-right font-medium">Fysiek</th>
                <th className="p-2 text-right font-medium">Tel/online</th>
                <th className="p-2 text-right font-medium">Afwezig</th>
                <th className="p-2 text-right font-medium">Opvang</th>
                <th className="p-2 text-right font-medium">Present (F∪T)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {klasEntries.map(([label, s]) => (
                <tr key={label}>
                  <td className="p-2">{label}</td>
                  <td className="p-2 text-right">{s.totaal}</td>
                  <td className="p-2 text-right">{fmtCountPct(s.fysiekAanwezig, s.totaal)}</td>
                  <td className="p-2 text-right">{fmtCountPct(s.telefonischOnline, s.totaal)}</td>
                  <td className="p-2 text-right">{fmtCountPct(s.afwezig, s.totaal)}</td>
                  <td className="p-2 text-right">{fmtCountPct(s.opvangGebruikt, s.totaal)}</td>
                  <td className="p-2 text-right">{fmtCountPct(s.present, s.totaal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50/60">
              <tr>
                <td className="p-2 font-medium">Totaal</td>
                <td className="p-2 text-right">{totaal.totaal}</td>
                <td className="p-2 text-right">{fmtCountPct(totaal.fysiekAanwezig, totaal.totaal)}</td>
                <td className="p-2 text-right">{fmtCountPct(totaal.telefonischOnline, totaal.totaal)}</td>
                <td className="p-2 text-right">{fmtCountPct(totaal.afwezig, totaal.totaal)}</td>
                <td className="p-2 text-right">{fmtCountPct(totaal.opvangGebruikt, totaal.totaal)}</td>
                <td className="p-2 text-right">{fmtCountPct(totaal.present, totaal.totaal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Per stroom */}
      <section>
        <h2 className="font-medium mb-2">Per stroom</h2>
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-2 text-left font-medium">Stroom</th>
                <th className="p-2 text-right font-medium">Totaal</th>
                <th className="p-2 text-right font-medium">Fysiek</th>
                <th className="p-2 text-right font-medium">Tel/online</th>
                <th className="p-2 text-right font-medium">Afwezig</th>
                <th className="p-2 text-right font-medium">Opvang</th>
                <th className="p-2 text-right font-medium">Present (F∪T)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stroomEntries.map(([label, s]) => (
                <tr key={label}>
                  <td className="p-2">{label}</td>
                  <td className="p-2 text-right">{s.totaal}</td>
                  <td className="p-2 text-right">{fmtCountPct(s.fysiekAanwezig, s.totaal)}</td>
                  <td className="p-2 text-right">{fmtCountPct(s.telefonischOnline, s.totaal)}</td>
                  <td className="p-2 text-right">{fmtCountPct(s.afwezig, s.totaal)}</td>
                  <td className="p-2 text-right">{fmtCountPct(s.opvangGebruikt, s.totaal)}</td>
                  <td className="p-2 text-right">{fmtCountPct(s.present, s.totaal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50/60">
              <tr>
                <td className="p-2 font-medium">Totaal</td>
                <td className="p-2 text-right">{totaal.totaal}</td>
                <td className="p-2 text-right">{fmtCountPct(totaal.fysiekAanwezig, totaal.totaal)}</td>
                <td className="p-2 text-right">{fmtCountPct(totaal.telefonischOnline, totaal.totaal)}</td>
                <td className="p-2 text-right">{fmtCountPct(totaal.afwezig, totaal.totaal)}</td>
                <td className="p-2 text-right">{fmtCountPct(totaal.opvangGebruikt, totaal.totaal)}</td>
                <td className="p-2 text-right">{fmtCountPct(totaal.present, totaal.totaal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
{/* Grafieken */}
<StatsCharts
  klas={klasEntries.map(([label, s]) => ({
    label,
    totaal: s.totaal,
    fysiekAanwezig: s.fysiekAanwezig,
    telefonischOnline: s.telefonischOnline,
    afwezig: s.afwezig,
    opvangGebruikt: s.opvangGebruikt,
  }))}
  stroom={stroomEntries.map(([label, s]) => ({
    label,
    totaal: s.totaal,
    fysiekAanwezig: s.fysiekAanwezig,
    telefonischOnline: s.telefonischOnline,
    afwezig: s.afwezig,
    opvangGebruikt: s.opvangGebruikt,
  }))}
  totaal={totaal}
/>


      </section>
    </div>
  );
}
