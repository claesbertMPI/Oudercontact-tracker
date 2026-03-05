"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Klas = { id: number; code: string; naam?: string | null };
type Student = {
  id: number;
  firstName: string;
  lastName: string;
  classId: number | null;
  class?: Klas | null;
};
type Attendance = {
  studentId: number;
  oudercontactId: number;
  fysiekAanwezig: boolean;
  telefonischOnline: boolean;
  afwezig: boolean;
  opvangGebruikt: boolean;
};

export default function ChecklistClient({
  leerlingen,
  klassen = [],
  attendances = [],
  oudercontactId,
}: {
  leerlingen: Student[];
  klassen?: Klas[];
  attendances?: Attendance[];
  oudercontactId: number;
}) {
  const [selectedClassCode, setSelectedClassCode] = useState<string>("");

  // state per flag
  const [fysiek, setFysiek] = useState<Map<number, boolean>>(new Map());
  const [tel, setTel] = useState<Map<number, boolean>>(new Map());
  const [afw, setAfw] = useState<Map<number, boolean>>(new Map());
  const [opvang, setOpvang] = useState<Map<number, boolean>>(new Map());
  const [saving, setSaving] = useState<Map<number, "idle" | "saving" | "saved" | "error">>(new Map());

  // slimme signature om alleen te resetten als props echt veranderen
  const attSig = useMemo(
    () =>
      attendances
        .slice()
        .sort((a, b) => a.studentId - b.studentId)
        .map(
          (a) =>
            `${a.studentId}:${a.fysiekAanwezig ? 1 : 0}:${a.telefonischOnline ? 1 : 0}:${a.afwezig ? 1 : 0}:${a.opvangGebruikt ? 1 : 0}`
        )
        .join("|"),
    [attendances]
  );
  const lastSigRef = useRef<string>("");

  useEffect(() => {
    if (lastSigRef.current === attSig) return;
    lastSigRef.current = attSig;

    const F = new Map<number, boolean>();
    const T = new Map<number, boolean>();
    const A = new Map<number, boolean>();
    const O = new Map<number, boolean>();
    for (const a of attendances) {
      F.set(a.studentId, !!a.fysiekAanwezig);
      T.set(a.studentId, !!a.telefonischOnline);
      A.set(a.studentId, !!a.afwezig);
      O.set(a.studentId, !!a.opvangGebruikt);
    }
    setFysiek(F); setTel(T); setAfw(A); setOpvang(O);
  }, [attSig, attendances]);

  const klasOptions = useMemo<Klas[]>(() => {
    if (klassen.length > 0) return klassen;
    const m = new Map<number, Klas>();
    for (const l of leerlingen) if (l.class) m.set(l.class.id, l.class);
    return Array.from(m.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [klassen, leerlingen]);

  const filtered = useMemo(() => {
    if (!selectedClassCode) return leerlingen;
    return leerlingen.filter((l) => l.class?.code === selectedClassCode);
  }, [leerlingen, selectedClassCode]);

  async function save(studentId: number, patch: Partial<Attendance>) {
    setSaving((prev) => { const n = new Map(prev); n.set(studentId, "saving"); return n; });
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, oudercontactId, ...patch }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaving((prev) => { const n = new Map(prev); n.set(studentId, "saved"); return n; });
      setTimeout(() => {
        setSaving((prev) => { const n = new Map(prev); if (n.get(studentId) === "saved") n.set(studentId, "idle"); return n; });
      }, 800);
    } catch {
      setSaving((prev) => { const n = new Map(prev); n.set(studentId, "error"); return n; });
    }
  }

  // Handlers (eerste 3 exclusief)
  const onFysiek = (id: number, v: boolean) => {
    setFysiek((p) => new Map(p).set(id, v));
    if (v) { setTel((p) => new Map(p).set(id, false)); setAfw((p) => new Map(p).set(id, false)); }
    void save(id, { fysiekAanwezig: v });
  };
  const onTel = (id: number, v: boolean) => {
    setTel((p) => new Map(p).set(id, v));
    if (v) { setFysiek((p) => new Map(p).set(id, false)); setAfw((p) => new Map(p).set(id, false)); }
    void save(id, { telefonischOnline: v });
  };
  const onAfw = (id: number, v: boolean) => {
    setAfw((p) => new Map(p).set(id, v));
    if (v) { setFysiek((p) => new Map(p).set(id, false)); setTel((p) => new Map(p).set(id, false)); }
    void save(id, { afwezig: v });
  };
  const onOpvang = (id: number, v: boolean) => {
    setOpvang((p) => new Map(p).set(id, v));
    void save(id, { opvangGebruikt: v });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Filter */}
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Klas</label>
          <select
            value={selectedClassCode}
            onChange={(e) => setSelectedClassCode(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">Alle klassen</option>
            {klasOptions.map((k) => {
              const showNaam = k.naam && k.naam.trim().toUpperCase() !== k.code.toUpperCase();
              return (
                <option key={k.id} value={k.code}>
                  {showNaam ? `${k.code} — ${k.naam}` : k.code}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Klas</th>
              <th className="px-3 py-2 text-left font-medium">Naam</th>
              <th className="px-3 py-2 text-center font-medium">Fysiek aanwezig</th>
              <th className="px-3 py-2 text-center font-medium">Telefonisch/online</th>
              <th className="px-3 py-2 text-center font-medium">Afwezig</th>
              <th className="px-3 py-2 text-center font-medium">Opvang</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((l) => {
              const sId = l.id;
              const f = fysiek.get(sId) ?? false;
              const t = tel.get(sId) ?? false;
              const a = afw.get(sId) ?? false;
              const o = opvang.get(sId) ?? false;
              const st = saving.get(sId) ?? "idle";
              return (
                <tr key={sId} className="align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                    <div className="font-medium">{l.class?.code ?? "—"}</div>
                    {l.class?.naam &&
                      l.class.naam.trim().toUpperCase() !== (l.class.code ?? "").toUpperCase() && (
                        <div className="text-xs text-slate-500">{l.class.naam}</div>
                      )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {l.lastName} {l.firstName}
                    </div>
                  </td>
<td className="px-3 py-2">
  <div className="flex justify-center">
    <input type="checkbox" className="h-5 w-5" checked={f} onChange={(e)=>onFysiek(sId, e.target.checked)} />
  </div>
</td>
<td className="px-3 py-2">
  <div className="flex justify-center">
    <input type="checkbox" className="h-5 w-5" checked={t} onChange={(e)=>onTel(sId, e.target.checked)} />
  </div>
</td>
<td className="px-3 py-2">
  <div className="flex justify-center">
    <input type="checkbox" className="h-5 w-5" checked={a} onChange={(e)=>onAfw(sId, e.target.checked)} />
  </div>
</td>
<td className="px-3 py-2">
  <div className="flex justify-center">
    <input type="checkbox" className="h-5 w-5" checked={o} onChange={(e)=>onOpvang(sId, e.target.checked)} />
  </div>
</td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    {st === "saving" && <span className="text-amber-600">Opslaan…</span>}
                    {st === "saved" && <span className="text-green-600">Opgeslagen</span>}
                    {st === "error" && <span className="text-red-600">Fout</span>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  Geen leerlingen gevonden voor deze filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
