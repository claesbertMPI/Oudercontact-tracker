import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, context: { params: { oudercontactId: string } }) {
  const oudercontactId = parseInt(context.params.oudercontactId, 10);
  const body = await req.json();
  const { studentId, present, comment } = body;

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

  return Response.json({ status: "ok", result });
}
