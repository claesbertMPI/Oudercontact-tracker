import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
type DebugRow = { firstName: string; lastName: string; code: string; leerlingnummer: string; raw: Row };
type SkipReasons = { missingFirst: number; missingLast: number; missingClass: number; missingId: number };

interface InformatStudent {
  pPersoon: number | string;
  naam?: string;
  voornaam?: string;
}

interface InformatInschrKlas {
  groepType: number;
  klasCode?: string;
  begindatum?: string;
  einddatum?: string;
}

interface InformatRegistration {
  pPersoon: number | string;
  stamnr?: string | number;
  begindatum?: string;
  einddatum?: string;
  inschrKlassen?: InformatInschrKlas[];
}

function klasCodeFrom(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  const [head] = s.split(/\s*[-–—−]\s*/);
  return head.replace(/\s+/g, "").toUpperCase();
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}

function calculateSchoolYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 7 ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endYearShort}`;
}

async function getInformatAccessToken(clientId: string, clientSecret: string, instituteNo: string): Promise<string> {
  const tokenUrl = "https://www.identityserver.be/connect/token";
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: `api_informat_sas_leerlingen.leerlingen.${instituteNo}`,
  });

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  if (!resp.ok) throw new Error(`Informat OAuth mislukt (${resp.status})`);
  const json = await resp.json();
  return json.access_token;
}

async function fetchInformatData<T>(endpoint: string, instituteNo: string, accessToken: string): Promise<T> {
  const resp = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      InstituteNo: instituteNo,
      Timestamp: new Date().toISOString(),
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!resp.ok) throw new Error(`API fetch mislukt op ${endpoint}`);
  return resp.json();
}

export async function GET(request: Request) {
  const clientId = process.env.INFORMAT_CLIENT_ID;
  const clientSecret = process.env.INFORMAT_CLIENT_SECRET;
  const instituteNo = process.env.INFORMAT_INSTITUTE_NO;

  if (!clientId || !clientSecret || !instituteNo) {
    return NextResponse.json({ error: "Omgevingsvariabelen ontbreken" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const debug = searchParams.get("debug") === "1";
  const maxDebug = Number(searchParams.get("max") ?? "5");

  const refDateObj = new Date();
  const refDateIso = refDateObj.toISOString().split("T")[0];
  const schoolYear = calculateSchoolYear(refDateObj);
  const refTime = refDateObj.getTime();

  try {
    const accessToken = await getInformatAccessToken(clientId, clientSecret, instituteNo);

    const [studentsRes, regRes] = await Promise.all([
      fetchInformatData<{ students: InformatStudent[] }>(
        `https://leerlingenapi.informatsoftware.be/1/students?schoolYear=${schoolYear}&refdate=${refDateIso}`,
        instituteNo, accessToken
      ),
      fetchInformatData<{ registrations: InformatRegistration[] }>(
        `https://leerlingenapi.informatsoftware.be/1/registrations?schoolYear=${schoolYear}`,
        instituteNo, accessToken
      )
    ]);

    const studentByPPersoon = new Map(studentsRes.students?.map(s => [s.pPersoon, s]));
    
    // 1. Data vooraf opschonen en uniek maken per leerlingnummer
    const uniqueImportMap = new Map<string, { firstName: string; lastName: string; code: string; leerlingnummer: string; raw: Row }>();
    const skipReasons: SkipReasons = { missingFirst: 0, missingLast: 0, missingClass: 0, missingId: 0 };

    for (const reg of regRes.registrations || []) {
      const regBegin = reg.begindatum ? new Date(reg.begindatum).getTime() : null;
      const regEnd = reg.einddatum ? new Date(reg.einddatum).getTime() : null;
      if ((regBegin && regBegin > refTime) || (regEnd && regEnd < refTime)) continue;

      const studentInfo = studentByPPersoon.get(reg.pPersoon);
      const lastName = (studentInfo?.naam ?? "").trim();
      const firstName = (studentInfo?.voornaam ?? "").trim();
      
      const stamnrRaw = String(reg.stamnr ?? "").trim();
      const leerlingnummer = stamnrRaw.length > 2 ? stamnrRaw.substring(2) : stamnrRaw;

      for (const klasReg of reg.inschrKlassen || []) {
        if (klasReg.groepType !== 0) continue;

        const klasBegin = klasReg.begindatum ? new Date(klasReg.begindatum).getTime() : null;
        const klasEnd = klasReg.einddatum ? new Date(klasReg.einddatum).getTime() : null;
        if ((klasBegin && klasBegin > refTime) || (klasEnd && klasEnd < refTime)) continue;

        const code = klasCodeFrom(klasReg.klasCode ?? "");

        if (!firstName) skipReasons.missingFirst++;
        if (!lastName) skipReasons.missingLast++;
        if (!code) skipReasons.missingClass++;
        if (!leerlingnummer) skipReasons.missingId++;

        if (firstName && lastName && code && leerlingnummer) {
          uniqueImportMap.set(leerlingnummer, {
            firstName, lastName, code, leerlingnummer,
            raw: { ...reg as unknown as Row, student: studentInfo as unknown as Row }
          });
        }
      }
    }

    let inserted = 0, updated = 0, reconciled = 0, skipped = 0;
    const classCache = new Map<string, number>();
    const debugRows: DebugRow[] = [];

    // 2. Unieke dataset verwerken in de database
    for (const item of uniqueImportMap.values()) {
      const { firstName, lastName, code, leerlingnummer, raw } = item;

      if (debug && debugRows.length < maxDebug) debugRows.push({ firstName, lastName, code, leerlingnummer, raw });

      // Klas ID bepalen
      let classId = classCache.get(code);
      if (!classId) {
        const klas = await prisma.class.upsert({
          where: { code },
          update: {},
          create: { code, naam: code },
          select: { id: true },
        });
        classId = klas.id;
        classCache.set(code, classId);
      }

      // Zoek op leerlingnummer
      let student = await prisma.student.findUnique({
        where: { leerlingnummer },
        select: { id: true },
      });

      // Niet gevonden op ID? Zoek op Voornaam + Achternaam (voorkomt dubbels van WISA-overgang)
      if (!student) {
        const existingByName = await prisma.student.findFirst({
          where: {
            firstName: { equals: firstName, mode: "insensitive" },
            lastName: { equals: lastName, mode: "insensitive" },
          },
          select: { id: true },
        });

        if (existingByName) {
          student = await prisma.student.update({
            where: { id: existingByName.id },
            data: { leerlingnummer, classId, firstName, lastName },
            select: { id: true },
          });
          reconciled++;
        }
      } else {
        await prisma.student.update({
          where: { id: student.id },
          data: { firstName, lastName, classId },
        });
        updated++;
      }

      // Indien echt een nieuwe leerling
      if (!student) {
        await prisma.student.create({
          data: { leerlingnummer, firstName, lastName, classId },
        });
        inserted++;
      }
    }

    return NextResponse.json({
      message: "Import via Informat API voltooid",
      counts: { inserted, updated, reconciled, skipped, total: uniqueImportMap.size },
      ...(debug && { debug: { skipReasons, sample: debugRows } })
    });

  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
