import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }  // note: Promise<…>
) {
  // 1) await the params before using
  const params = await context.params;
  const oudercontactId = parseInt(params.oudercontactId, 10);

  // 2) session guard
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  // 3) parse payload
  const { studentId, present, comment } = await req.json();

  // 4) upsert with correct compound-unique key
  await prisma.attendance.upsert({
    where: {
      studentId_oudercontactId: { studentId, oudercontactId },
    },
    update: { present, comment },
    create: { studentId, oudercontactId, present, comment },
  });

  return NextResponse.json({ success: true });
}
