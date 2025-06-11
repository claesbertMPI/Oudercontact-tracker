// src/app/api/statistieken/route.ts

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // 1) Sessies beschermen
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  // 2) Payload uitlezen
  const { oudercontactIds } = (await req.json()) as { oudercontactIds: number[] };
  if (!Array.isArray(oudercontactIds) || oudercontactIds.length === 0) {
    return NextResponse.json({ perKlas: [], perWijzer: [] });
  }

  // 3) Alle leerlingen ophalen
  const leerlingen = await prisma.student.findMany();

  // 4) Voor elke oudercontact id per klas en per wijzer stats verzamelen
  const klasStatsPerEvent: Record<
    string,
    { aanwezig: number; totaal: number }[]
  > = {};
  const wijzerStatsPerEvent: Record<
    string,
    { aanwezig: number; totaal: number }[]
  > = {};

  for (const ocId of oudercontactIds) {
    const aanwezigheden = await prisma.attendance.findMany({
      where: { oudercontactId: ocId },
    });

    // Per klas en per wijzer tijdelijke teller
    const tempKlas: Record<string, { aanwezig: number; totaal: number }> = {};
    const tempWijzer: Record<string, { aanwezig: number; totaal: number }> = {};

    for (const leerling of leerlingen) {
      const klas = leerling.class;
      const wijzer = klas.slice(0, 3);

      tempKlas[klas] ??= { aanwezig: 0, totaal: 0 };
      tempWijzer[wijzer] ??= { aanwezig: 0, totaal: 0 };

      tempKlas[klas].totaal++;
      tempWijzer[wijzer].totaal++;

      if (
        aanwezigheden.some(
          (a) => a.studentId === leerling.id && a.present
        )
      ) {
        tempKlas[klas].aanwezig++;
        tempWijzer[wijzer].aanwezig++;
      }
    }

    // Opslaan in de per-event arrays
    for (const [klas, stats] of Object.entries(tempKlas)) {
      klasStatsPerEvent[klas] ??= [];
      klasStatsPerEvent[klas].push(stats);
    }
    for (const [wijzer, stats] of Object.entries(tempWijzer)) {
      wijzerStatsPerEvent[wijzer] ??= [];
      wijzerStatsPerEvent[wijzer].push(stats);
    }
  }

  // 5) Gemiddelde berekenen per klas
  const perKlas = Object.entries(klasStatsPerEvent).map(
    ([klas, statsArr]) => {
      const sumPerc = statsArr.reduce(
        (sum, { aanwezig, totaal }) =>
          sum + (totaal > 0 ? (aanwezig / totaal) * 100 : 0),
        0
      );
      const avg = statsArr.length ? sumPerc / statsArr.length : 0;
      return { klas, percentage: Math.round(avg) };
    }
  );

  // 6) Gemiddelde berekenen per wijzer
  const perWijzer = Object.entries(wijzerStatsPerEvent).map(
    ([wijzer, statsArr]) => {
      const sumPerc = statsArr.reduce(
        (sum, { aanwezig, totaal }) =>
          sum + (totaal > 0 ? (aanwezig / totaal) * 100 : 0),
        0
      );
      const avg = statsArr.length ? sumPerc / statsArr.length : 0;
      return { wijzer, percentage: Math.round(avg) };
    }
  );

  // 7) Antwoord teruggeven
  return NextResponse.json({ perKlas, perWijzer });
}
