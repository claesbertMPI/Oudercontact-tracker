import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, context: any) {
  const oudercontactId = parseInt(context.params.oudercontactId, 10);

  const leerlingen = await prisma.student.findMany();
  const aanwezigheden = await prisma.attendance.findMany({
    where: { oudercontactId },
  });

  const perKlas: Record<string, { totaal: number; aanwezig: number }> = {};
  const perWijzer: Record<string, { totaal: number; aanwezig: number }> = {};

  for (const leerling of leerlingen) {
    const klas = leerling.class;
    const wijzer = klas.slice(0, 3);

    if (!perKlas[klas]) perKlas[klas] = { totaal: 0, aanwezig: 0 };
    if (!perWijzer[wijzer]) perWijzer[wijzer] = { totaal: 0, aanwezig: 0 };

    perKlas[klas].totaal++;
    perWijzer[wijzer].totaal++;

    const aanwezig = aanwezigheden.find((a) => a.studentId === leerling.id)?.present ?? false;
    if (aanwezig) {
      perKlas[klas].aanwezig++;
      perWijzer[wijzer].aanwezig++;
    }
  }

  const perKlasArray = Object.entries(perKlas).map(([klas, { aanwezig, totaal }]) => ({
    klas,
    aanwezig,
    totaal,
    percentage: totaal > 0 ? Math.round((aanwezig / totaal) * 100) : 0,
  }));

  const perWijzerArray = Object.entries(perWijzer).map(([wijzer, { aanwezig, totaal }]) => ({
    wijzer,
    aanwezig,
    totaal,
    percentage: totaal > 0 ? Math.round((aanwezig / totaal) * 100) : 0,
  }));

  return NextResponse.json({
    perKlas: perKlasArray,
    perWijzer: perWijzerArray,
  });
}
