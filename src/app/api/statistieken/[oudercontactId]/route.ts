// src/app/api/statistieken/[oudercontactId]/route.ts

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ oudercontactId: string }> }
) {
  // ● await the params-Promise itself
  const paramsObj = await context.params;
  const oudercontactId = parseInt(paramsObj.oudercontactId, 10);

  // ● session guard
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  // ● fetch data
  const leerlingen = await prisma.student.findMany();
  const aanwezigheden = await prisma.attendance.findMany({
    where: { oudercontactId },
  });

  // ● build stats
  const perKlas: Record<string, { totaal: number; aanwezig: number }> = {};
  const perWijzer: Record<string, { totaal: number; aanwezig: number }> = {};

  for (const leerling of leerlingen) {
    const klas = leerling.class;
    const wijzer = klas.slice(0, 3);

    perKlas[klas] ??= { totaal: 0, aanwezig: 0 };
    perWijzer[wijzer] ??= { totaal: 0, aanwezig: 0 };

    perKlas[klas].totaal++;
    perWijzer[wijzer].totaal++;

    if (
      aanwezigheden.some(
        (a) => a.studentId === leerling.id && a.present
      )
    ) {
      perKlas[klas].aanwezig++;
      perWijzer[wijzer].aanwezig++;
    }
  }

  // ● transform to arrays with percentages
  const perKlasArray = Object.entries(perKlas).map(
    ([klas, stats]) => ({
      klas,
      ...stats,
      percentage: stats.totaal
        ? Math.round((stats.aanwezig / stats.totaal) * 100)
        : 0,
    })
  );
  const perWijzerArray = Object.entries(perWijzer).map(
    ([wijzer, stats]) => ({
      wijzer,
      ...stats,
      percentage: stats.totaal
        ? Math.round((stats.aanwezig / stats.totaal) * 100)
        : 0,
    })
  );

  // ● return the JSON
  return NextResponse.json({
    perKlas: perKlasArray,
    perWijzer: perWijzerArray,
  });
}
