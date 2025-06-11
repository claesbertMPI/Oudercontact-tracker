// src/app/oudercontacten/[id]/page.tsx

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ChecklistClient from "./ChecklistClient";

export default async function Page(_props: unknown) {
  // 1) Await the async params promise to get the real params object
  const params = await (_props as { params: Promise<{ id: string }> }).params;
  const id = params.id;
  const oudercontactId = parseInt(id, 10);

  // 2) Validate ID
  if (!id || isNaN(oudercontactId)) {
    return (
      <div className="p-8 text-red-600">
        ❌ Ongeldig oudercontact-ID: <code>{id}</code>
      </div>
    );
  }

  // 3) Fetch data from the database
  const oudercontact = await prisma.oudercontact.findUnique({
    where: { id: oudercontactId },
  });
  if (!oudercontact) {
    return (
      <div className="p-8 text-red-600">
        ❌ Geen oudercontact gevonden met ID {oudercontactId}
      </div>
    );
  }

  const leerlingen = await prisma.student.findMany({
    orderBy: [
      { class: "asc" },
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  const aanwezigheden = await prisma.attendance.findMany({
    where: { oudercontactId },
  });

  const oudercontactWithDateString = {
    ...oudercontact,
    dateString: oudercontact.date.toISOString(),
  };

  // 4) Render the page with a back link
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/oudercontacten"
        className="inline-block mb-6 text-blue-600 hover:underline"
      >
        ← Terug naar alle oudercontacten
      </Link>

      <ChecklistClient
        oudercontact={oudercontactWithDateString}
        leerlingen={leerlingen}
        aanwezigheden={aanwezigheden}
      />
    </div>
  );
}
