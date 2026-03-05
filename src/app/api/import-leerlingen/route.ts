import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Row = Record<string, string>;
type DebugRow = { firstName: string; lastName: string; code: string; leerlingnummer: string; raw: Row };
type SkipReasons = { missingFirst: number; missingLast: number; missingClass: number; missingId: number };

function splitCSVLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
function detectDelimiter(firstLine: string): string {
  const semi = (firstLine.match(/;/g) ?? []).length;
  const comma = (firstLine.match(/,/g) ?? []).length;
  return semi > comma ? ";" : ",";
}
function pick(obj: Row, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function klasCodeFrom(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  // splits op -, en-dash, em-dash, minus sign, met optionele spaties eromheen
  const [head] = s.split(/\s*[-–—−]\s*/);
  // normaliseer: hoofdletters, interne spaties weg
  return head.replace(/\s+/g, "").toUpperCase();
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}

export async function GET(request: Request) {
  const username = process.env.WISA_USERNAME;
  const password = process.env.WISA_PASSWORD;
  if (!username || !password) {
    return NextResponse.json({ error: "Missing WISA credentials" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const debug = searchParams.get("debug") === "1";
  const maxDebug = Number(searchParams.get("max") ?? "5");

  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const werkdatum = `${dd}/${mm}/${yyyy}`;

  const url = `https://sgr17.schoolware.be/webwisad/bin/server.fcgi/QUERY/EXPMPI?werkdatum=${encodeURIComponent(
    werkdatum
  )}&format=csv&IS_ID=15&_username_=${encodeURIComponent(username)}&_password_=${encodeURIComponent(password)}`;

  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      const body = await resp.text();
      return NextResponse.json(
        { error: "WISA fetch failed", status: resp.status, body: body.slice(0, 800) },
        { status: 502 }
      );
    }

    const raw = await resp.text();
    const text = raw.replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length < 2) return NextResponse.json({ error: "Geen data ontvangen" }, { status: 500 });

    const delimiter = detectDelimiter(lines[0]);
    const headers = splitCSVLine(lines[0], delimiter).map((h) => h.trim());

    const toObject = (line: string): Row => {
      const cells = splitCSVLine(line, delimiter);
      const obj: Row = {};
      for (let i = 0; i < headers.length; i++) obj[headers[i]] = cells[i] ?? "";
      return obj;
    };

    let inserted = 0, updated = 0, reconciled = 0, skipped = 0;
    const skipReasons: SkipReasons = { missingFirst: 0, missingLast: 0, missingClass: 0, missingId: 0 };
    const debugRows: DebugRow[] = [];
    const classCache = new Map<string, number>();

    for (let i = 1; i < lines.length; i++) {
      const row = toObject(lines[i]);

      const lastName = pick(row, "LL_NAAM", "NAAM", "Familienaam", "familienaam", "lastName", "Achternaam");
      const firstName = pick(row, "LL_VOORNAAM", "VOORNAAM", "Voornaam", "voornaam", "firstName");
      const wisaClassRaw = pick(row, "KL_CODE", "KlasCode", "KLASCODE", "Klas", "KLAS");
      const code = klasCodeFrom(wisaClassRaw);
      const leerlingnummer = pick(
        row,
        "LL_ID", "IU_STAMBOEKNUMMER",
        "LEERLINGNUMMER", "LE_IDNUMMER", "LE_ID", "Leerlingnummer", "leerlingnummer", "ID"
      );

      let rowSkipped = false;
      if (!firstName) { skipReasons.missingFirst++; rowSkipped = true; }
      if (!lastName)  { skipReasons.missingLast++;  rowSkipped = true; }
      if (!code)      { skipReasons.missingClass++; rowSkipped = true; }
      if (!leerlingnummer) { skipReasons.missingId++; rowSkipped = true; }

      if (debug && debugRows.length < maxDebug) {
        debugRows.push({ firstName, lastName, code, leerlingnummer, raw: row });
      }

      if (rowSkipped) { skipped++; continue; }

      let classId = classCache.get(code);
      if (!classId) {
        const rawNaam = pick(row, "KL_NAAM", "KlasNaam");
        const naam = rawNaam?.trim();
        const naamDistinct = naam && naam.toUpperCase() !== code.toUpperCase() ? naam : null;

        const klas = await prisma.class.upsert({
          where: { code },
          update: naamDistinct !== null ? { naam: naamDistinct } : {},
          create: { code, naam: naamDistinct },
          select: { id: true },
        });
        classId = klas.id;
        classCache.set(code, classId);
      }

      // Reconcile LEGACY → echt leerlingnummer (eenmalig)
      let student = await prisma.student.findUnique({
        where: { leerlingnummer },
        select: { id: true },
      });
      if (!student) {
        const legacy = await prisma.student.findFirst({
          where: {
            firstName: { equals: firstName, mode: "insensitive" },
            lastName:  { equals: lastName,  mode: "insensitive" },
            leerlingnummer: { startsWith: "LEGACY-" },
          },
          select: { id: true },
        });
        if (legacy) {
          student = await prisma.student.update({
            where: { id: legacy.id },
            data: { leerlingnummer, classId },
            select: { id: true },
          });
          reconciled++;
        }
      }

      if (student) {
        await prisma.student.update({
          where: { id: student.id },
          data: { firstName, lastName, classId },
        });
        updated++;
      } else {
        await prisma.student.create({
          data: { leerlingnummer, firstName, lastName, classId },
        });
        inserted++;
      }
    }

    const payload: {
      message: string;
      counts: { inserted: number; updated: number; reconciled: number; skipped: number; total: number };
      debug?: { headers: string[]; delimiter: string; skipReasons: SkipReasons; sample: DebugRow[] };
    } = {
      message: "Import via WISA-API voltooid",
      counts: { inserted, updated, reconciled, skipped, total: inserted + updated + skipped },
    };
    if (debug) {
      payload.debug = { headers, delimiter, skipReasons, sample: debugRows };
    }
    return NextResponse.json(payload);
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
