import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, { params }: { params: any }) {
  const oudercontactId = parseInt(params.oudercontactId, 10);

  const { studentId, present, comment } = await req.json();

  const result = await prisma.attendance.upsert({
    where: {
      studentId_oudercontactId: {
        studentId,
        oudercontactId,
      },
    },
    update: {
      present,
      comment,
    },
    create: {
      studentId,
      oudercontactId,
      present,
      comment,
    },
  });

  return NextResponse.json({ status: "ok", result });
}
