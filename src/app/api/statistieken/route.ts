import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Flags = {
  fysiekAanwezig: boolean;
  telefonischOnline: boolean;
  afwezig: boolean;
  opvangGebruikt: boolean;
};
type Stat = {
  totaal: number;
  fysiekAanwezig: number;
  telefonischOnline: number;
  afwezig: number;
  opvangGebruikt: number;
  present: number; // fysiek || tel
};

function err(e: unknown) { return e instanceof Error ? e.message : String(e); }

async function computeStats(oudercontactId?: number) {
  // Leerlingen met klascode
  const leerlingen = await prisma.student.findMany({
    select: { id: true, class: { select: { code: true } } },
  });

  // Rows voor dit oudercontact (of leeg)
  const rows = oudercontactId
    ? await prisma.attendance.findMany({
        where: { oudercontactId },
        select: {
          studentId: true,
          fysiekAanwezig: true,
          telefonischOnline: true,
          afwezig: true,
          opvangGebruikt: true,
        },
      })
    : [];

  const byStudent = new Map<number, Flags>();
  for (const r of rows) {
    let f = !!r.fysiekAanwezig;
    let t = !!r.telefonischOnline;
    let a = !!r.afwezig;
    if (a) { f = false; t = false; } else if (f) { t = false; }
    byStudent.set(r.studentId, {
      fysiekAanwezig: f,
      telefonischOnline: t,
      afwezig: a,
      opvangGebruikt: !!r.opvangGebruikt,
    });
  }

  const empty = (): Stat => ({
    totaal: 0, fysiekAanwezig: 0, telefonischOnline: 0, afwezig: 0, opvangGebruikt: 0, present: 0,
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
      fysiekAanwezig: false, telefonischOnline: false, afwezig: false, opvangGebruikt: false,
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

  return { oudercontactId: oudercontactId ?? null, totaal, perKlas, perWijzer };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const oc = searchParams.get("oudercontactId");
    const oudercontactId = oc ? Number(oc) : undefined;
    if (oc && !Number.isInteger(oudercontactId)) {
      return NextResponse.json({ error: "oudercontactId moet een integer zijn" }, { status: 400 });
    }
    const data = await computeStats(oudercontactId);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { oudercontactId?: unknown } | null;
    const oudercontactId = body?.oudercontactId !== undefined ? Number(body.oudercontactId) : undefined;
    if (body?.oudercontactId !== undefined && !Number.isInteger(oudercontactId)) {
      return NextResponse.json({ error: "oudercontactId moet een integer zijn" }, { status: 400 });
    }
    const data = await computeStats(oudercontactId);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 500 });
  }
}
