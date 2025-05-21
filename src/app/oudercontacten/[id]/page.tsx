import { prisma } from "@/lib/prisma";
import ChecklistClient from "./ChecklistClient";

export default async function OudercontactChecklist({ params }: { params: { id: string } }) {
  const oudercontactId = parseInt(params.id);
  const oudercontact = await prisma.oudercontact.findUnique({ where: { id: oudercontactId } });
  const leerlingen = await prisma.student.findMany({ orderBy: [{ class: "asc" }, { lastName: "asc" }] });
  const aanwezigheden = await prisma.attendance.findMany({ where: { oudercontactId } });

  return (
    <ChecklistClient
      oudercontact={oudercontact}
      leerlingen={leerlingen}
      aanwezigheden={aanwezigheden}
    />
  );
}
