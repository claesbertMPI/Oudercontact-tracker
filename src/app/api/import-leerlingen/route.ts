import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const username = process.env.WISA_USERNAME;
  const password = process.env.WISA_PASSWORD;

  if (!username || !password) {
    return NextResponse.json({ error: "Missing WISA credentials" }, { status: 500 });
  }

  const vandaag = new Date();
  const werkdatum = vandaag.toLocaleDateString("nl-BE"); // bv. 20/05/2025

  const url = `https://sgr17.schoolware.be/webwisad/bin/server.fcgi/QUERY/EXPMPI?werkdatum=${werkdatum}&format=csv&IS_ID=15&_username_=${username}&_password_=${password}`;

  try {
    const response = await fetch(url);
    const csv = await response.text();


    const rows = csv.split("\n").map((line) => line.split(",")).filter(row => row.length > 2);

    const [, ...data] = rows; // skip header

    let inserted = 0;

for (const row of data) {
  const familienaam = row[0]?.replaceAll('"', '').trim();
  const voornaam = row[1]?.replaceAll('"', '').trim();
  const klas = row[2]?.replaceAll('"', '').slice(0, 4).trim();

  if (!familienaam || !voornaam || !klas) {
    console.log("❌ Overgeslagen rij:", row);
    continue;
  }

  console.log(`✔ ${voornaam} ${familienaam} (${klas})`);

  await prisma.student.upsert({
    where: {
      firstName_lastName_class: {
        firstName: voornaam,
        lastName: familienaam,
        class: klas,
      },
    },
    update: {},
    create: {
      firstName: voornaam,
      lastName: familienaam,
      class: klas,
    },
  });

  inserted++;
}

    return NextResponse.json({ message: `✔ ${inserted} leerlingen geïmporteerd` });
  } catch (err) {
    return NextResponse.json({ error: "Fout bij ophalen of verwerken", details: err }, { status: 500 });
  }
}
