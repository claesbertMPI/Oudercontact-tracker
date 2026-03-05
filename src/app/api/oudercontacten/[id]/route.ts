// src/app/api/oudercontacten/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ NextAuth v5 (aanbevolen)
import { auth } from "@/auth";

// ❗ Gebruik je v4? Gebruik dit i.p.v. bovenstaand:
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  // v5:
  const session = await auth();
  // v4:
  // const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "admin") {
    const err = new Error("FORBIDDEN");
    (err as any).status = 403;
    throw err;
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const id = Number(ctx.params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Ongeldig id" }, { status: 400 });
    }

    const exists = await prisma.oudercontact.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
    }

    // Verwijder eerst attendances, dan oudercontact (transactioneel)
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { oudercontactId: id } }),
      prisma.oudercontact.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.status === 403) {
      return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
    }
    return NextResponse.json({ error: e?.message || "Onbekende fout" }, { status: 500 });
  }
}
