"use client";

import { useEffect, useMemo, useState } from "react";

type Oudercontact = {
  id: number;
  title: string;
  date: string; // ISO string is ok
  schoolYear: string;
};

type SessionResp = {
  user?: { role?: string | null } | null;
} | null;

export default function OudercontactBeheerPage() {
  const [oudercontacten, setOudercontacten] = useState<Oudercontact[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  function schooljaarOpties() {
    const huidigeJaar = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => {
      const start = huidigeJaar - 1 + i;
      const eind = start + 1;
      return `${start}-${eind}`;
    });
  }

  const [form, setForm] = useState({
    title: "",
    date: "",
    schoolYear: schooljaarOpties()[0],
  });

  const fetchData = async () => {
    const res = await fetch("/api/oudercontacten");
    const data = await res.json();
    setOudercontacten(data);
  };

  const fetchSession = async () => {
    // NextAuth session endpoint
    const res = await fetch("/api/auth/session");
    if (!res.ok) return setIsAdmin(false);
    const session: SessionResp = await res.json().catch(() => null);
    setIsAdmin(session?.user?.role === "admin");
  };

  useEffect(() => {
    fetchSession();
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/oudercontacten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, period: "" }), // vaste lege string
    });

    if (res.ok) {
      setForm({ title: "", date: "", schoolYear: schooljaarOpties()[0] });
      fetchData();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Aanmaken mislukt: ${err?.error ?? res.status}`);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!isAdmin) return;
    const ok = window.confirm(
      `Zeker dat je "${title}" (ID ${id}) wil verwijderen?\nAlle aanwezigheden bij dit oudercontact worden ook verwijderd.`
    );
    if (!ok) return;

    const res = await fetch(`/api/oudercontacten/${id}`, { method: "DELETE" });
    if (res.ok) {
      // snappy UX: lokaal verwijderen, en dan herladen
      setOudercontacten((prev) => prev.filter((x) => x.id !== id));
      // (optioneel) fetchData();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Verwijderen mislukt: ${err?.error ?? res.status}`);
    }
  };

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">📆 Oudercontactbeheer</h1>

      {/* info voor niet-admins */}
      {!isAdmin && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-800 text-sm">
          Je bent ingelogd zonder admin-rechten. Verwijderen is uitgeschakeld.
        </div>
      )}

      {/* aanmaakformulier */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Titel"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
          className="w-full border p-2 rounded"
        />
        <select
          value={form.schoolYear}
          onChange={(e) => setForm({ ...form, schoolYear: e.target.value })}
          className="w-full border p-2 rounded"
        >
          {schooljaarOpties().map((sy) => (
            <option key={sy} value={sy}>
              {sy}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Oudercontact toevoegen
        </button>
      </form>

      {/* lijst */}
      <section>
        <h2 className="text-xl font-semibold mb-2">📋 Bestaande oudercontacten</h2>
        <ul className="space-y-2">
          {oudercontacten.map((oc) => (
            <li key={oc.id} className="border p-2 rounded flex justify-between items-center gap-3">
              <div className="min-w-0">
                <strong>{oc.title}</strong> ({oc.schoolYear}) –{" "}
                {new Date(oc.date).toLocaleDateString("nl-BE")}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/oudercontacten/${oc.id}`}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Ga naar checklist
                </a>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(oc.id, oc.title)}
                    className="px-3 py-1 rounded text-sm border border-red-600 text-red-600 hover:bg-red-50"
                    title="Verwijder oudercontact"
                  >
                    Verwijder
                  </button>
                )}
              </div>
            </li>
          ))}
          {oudercontacten.length === 0 && (
            <li className="text-slate-500 text-sm">Nog geen oudercontacten.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
