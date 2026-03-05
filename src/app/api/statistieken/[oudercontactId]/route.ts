import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Stat = {
  totaal: number;
  fysiekAanwezig: number;
  telefonischOnline: number;
  afwezig: number;
  opvangGebruikt: number;
  present: number; // fysiek || tel
};

function err(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export async function GET(request: Request) {
  try {
    // Parse oudercontactId uit pad
    const { pathname } = new URL(request.url);
    const parts = pathname.split("/").filter(Boolean);
    const idStr = parts[parts.length - 1];
    const oudercontactId = Number(idStr);
    if (!Number.isInteger(oudercontactId)) {
      return NextResponse.json({ error: "Ongeldig oudercontactId" }, { status: 400 });
    }

    // Leerlingen met klascode
    const leerlingen = await prisma.student.findMany({
      select: { id: true, class: { select: { code: true } } },
    });

    // Aanwezigheden voor dit oudercontact (nieuwe flags)
    const rows = await prisma.attendance.findMany({
      where: { oudercontactId },
      select: {
        studentId: true,
        fysiekAanwezig: true,
        telefonischOnline: true,
        afwezig: true,
        opvangGebruikt: true,
      },
    });

    // Map van studentId -> flags
    const byStudent = new Map<number, {
      fysiekAanwezig: boolean;
      telefonischOnline: boolean;
      afwezig: boolean;
      opvangGebruikt: boolean;
    }>();
    for (const r of rows) {
      // Normaliseer exclusiviteit
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

    const emptyStat = (): Stat => ({
      totaal: 0,
      fysiekAanwezig: 0,
      telefonischOnline: 0,
      afwezig: 0,
      opvangGebruikt: 0,
      present: 0,
    });

    const perKlas: Record<string, Stat> = Object.create(null);
    const perWijzer: Record<string, Stat> = Object.create(null);
    const totaal: Stat = emptyStat();

    for (const l of leerlingen) {
      const code = l.class?.code?.toUpperCase() ?? "—";
      const wijzer = code.slice(0, 3);

      perKlas[code] ??= emptyStat();
      perWijzer[wijzer] ??= emptyStat();

      const flags = byStudent.get(l.id) ?? {
        fysiekAanwezig: false,
        telefonischOnline: false,
        afwezig: false,
        opvangGebruikt: false,
      };
      const present = flags.fysiekAanwezig || flags.telefonischOnline;

      // totaal
      totaal.totaal += 1;
      totaal.fysiekAanwezig += flags.fysiekAanwezig ? 1 : 0;
      totaal.telefonischOnline += flags.telefonischOnline ? 1 : 0;
      totaal.afwezig += flags.afwezig ? 1 : 0;
      totaal.opvangGebruikt += flags.opvangGebruikt ? 1 : 0;
      totaal.present += present ? 1 : 0;

      // per klas
      const k = perKlas[code];
      k.totaal += 1;
      k.fysiekAanwezig += flags.fysiekAanwezig ? 1 : 0;
      k.telefonischOnline += flags.telefonischOnline ? 1 : 0;
      k.afwezig += flags.afwezig ? 1 : 0;
      k.opvangGebruikt += flags.opvangGebruikt ? 1 : 0;
      k.present += present ? 1 : 0;

      // per wijzer
      const w = perWijzer[wijzer];
      w.totaal += 1;
      w.fysiekAanwezig += flags.fysiekAanwezig ? 1 : 0;
      w.telefonischOnline += flags.telefonischOnline ? 1 : 0;
      w.afwezig += flags.afwezig ? 1 : 0;
      w.opvangGebruikt += flags.opvangGebruikt ? 1 : 0;
      w.present += present ? 1 : 0;
    }

    return NextResponse.json({
      oudercontactId,
      totaal,
      perKlas,
      perWijzer,
    });
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 500 });
  }
}
