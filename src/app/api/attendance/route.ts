import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Payload = {
  studentId: unknown;
  oudercontactId: unknown;
  fysiekAanwezig?: unknown;
  telefonischOnline?: unknown;
  afwezig?: unknown;
  opvangGebruikt?: unknown;
};

function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}
function msg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();

    const studentId = Number(body?.studentId);
    const oudercontactId = Number(body?.oudercontactId);

    if (!Number.isInteger(studentId) || !Number.isInteger(oudercontactId)) {
      return NextResponse.json(
        { error: "studentId en oudercontactId moeten integers zijn",
          received: { studentId: body?.studentId, oudercontactId: body?.oudercontactId } },
        { status: 400 }
      );
    }

    // Inkomende toggles (eventueel undefined = niet wijzigen)
    let fysiekAanwezig    = asBool(body?.fysiekAanwezig);
    let telefonischOnline = asBool(body?.telefonischOnline);
    let afwezig           = asBool(body?.afwezig);
    const opvangGebruikt  = asBool(body?.opvangGebruikt);

    // Haal huidige staat op (voor logica)
    const current = await prisma.attendance.findUnique({
      where: { studentId_oudercontactId: { studentId, oudercontactId } },
      select: {
        fysiekAanwezig: true,
        telefonischOnline: true,
        afwezig: true,
        opvangGebruikt: true,
      },
    });

    let next = {
      fysiekAanwezig: current?.fysiekAanwezig ?? false,
      telefonischOnline: current?.telefonischOnline ?? false,
      afwezig: current?.afwezig ?? false,
      opvangGebruikt: current?.opvangGebruikt ?? false,
    };

    // Pas wijzigingen toe
    if (fysiekAanwezig !== undefined) {
      next.fysiekAanwezig = fysiekAanwezig;
      if (fysiekAanwezig) { next.telefonischOnline = false; next.afwezig = false; }
    }
    if (telefonischOnline !== undefined) {
      next.telefonischOnline = telefonischOnline;
      if (telefonischOnline) { next.fysiekAanwezig = false; next.afwezig = false; }
    }
    if (afwezig !== undefined) {
      next.afwezig = afwezig;
      if (afwezig) { next.fysiekAanwezig = false; next.telefonischOnline = false; }
    }
    if (opvangGebruikt !== undefined) next.opvangGebruikt = opvangGebruikt;

    // Legacy 'present' bijhouden: present = fysiek of telefonisch
    const present = next.fysiekAanwezig || next.telefonischOnline;

    const attendance = await prisma.attendance.upsert({
      where: { studentId_oudercontactId: { studentId, oudercontactId } },
      update: { ...next, present },
      create: { studentId, oudercontactId, ...next, present },
      select: {
        id: true, studentId: true, oudercontactId: true, present: true,
        fysiekAanwezig: true, telefonischOnline: true, afwezig: true, opvangGebruikt: true
      },
    });

    return NextResponse.json({ ok: true, attendance });
  } catch (e: unknown) {
    return NextResponse.json({ error: msg(e) }, { status: 500 });
  }
}
