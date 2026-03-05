// src/app/oudercontacten/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import ChecklistClient from "./ChecklistClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>; // ← Next 15: params is een Promise
}) {
  const { id } = await params;     // ← await de params
  const oudercontactId = Number(id);
  if (!Number.isFinite(oudercontactId)) {
    throw new Error("Ongeldig oudercontact id");
  }

const [leerlingen, klassen, attendances] = await Promise.all([
  prisma.student.findMany({
    orderBy: [{ class: { code: "asc" } }, { lastName: "asc" }, { firstName: "asc" }],
    include: { class: { select: { id: true, code: true, naam: true } } },
  }),
  prisma.class.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, naam: true } }),
  prisma.attendance.findMany({
    where: { oudercontactId },
    select: {
      studentId: true, oudercontactId: true,
      fysiekAanwezig: true, telefonischOnline: true, afwezig: true, opvangGebruikt: true,
    },
  }),
]);

  return (
    <div className="space-y-4">
      <ChecklistClient
        key={oudercontactId}
        leerlingen={leerlingen}
        klassen={klassen}
        attendances={attendances}
        oudercontactId={oudercontactId}
      />
    </div>
  );
}
