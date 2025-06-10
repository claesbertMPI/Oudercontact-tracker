import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, context: { params: Record<string, string> }) {
  // 1) pak params wél pas hier
  const oudercontactId = parseInt(context.params.oudercontactId, 10);

  // 2) sessie-check (anders mag niemand data schrijven)
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  // 3) verwerk de payload
  const { studentId, present, comment } = await req.json();

  await prisma.attendance.upsert({
    where: { oudercontactId_studentId: { oudercontactId, studentId } },
    update: { present, comment },
    create: { oudercontactId, studentId, present, comment },
  });

  return NextResponse.json({ success: true });
}
