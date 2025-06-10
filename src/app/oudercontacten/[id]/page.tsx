// src/app/oudercontacten/[id]/page.tsx

import { prisma } from "@/lib/prisma";
import ChecklistClient from "./ChecklistClient";

export default async function Page(_props: unknown) {
  // Cast om Params te extraheren zonder impliciete any-fout
  const { params } = _props as { params: { id: string } };
  const id = params.id;
  const oudercontactId = parseInt(id, 10);

  if (!id || isNaN(oudercontactId)) {
    return (
      <div className="p-8 text-red-600">
        ❌ Ongeldig oudercontact-ID: <code>{id}</code>
      </div>
    );
  }

  try {
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

    return (
      <ChecklistClient
        oudercontact={oudercontactWithDateString}
        leerlingen={leerlingen}
        aanwezigheden={aanwezigheden}
      />
    );
  } catch (err) {
    console.error("❌ Fout tijdens ophalen oudercontact:", err);
    return (
      <div className="p-8 text-red-600">
        ⚠️ Fout bij het laden van gegevens.
      </div>
    );
  }
}
