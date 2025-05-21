import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const data = await prisma.oudercontact.findMany({
    orderBy: { date: "desc" },
  });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, date, schoolYear, period } = body;

  const result = await prisma.oudercontact.create({
    data: {
      title,
      date: new Date(date),
      schoolYear,
      period,
    },
  });

  return Response.json(result);
}

