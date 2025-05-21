"use client";

import { useEffect, useState } from "react";

export default function OudercontactBeheerPage() {
  const [oudercontacten, setOudercontacten] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    date: "",
    schoolYear: schooljaarOpties()[0],
  });

  function schooljaarOpties() {
    const huidigeJaar = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => {
      const start = huidigeJaar -1 + i;
      const eind = start + 1;
      return `${start}-${eind}`;
    });
  }

  const fetchData = async () => {
    const res = await fetch("/api/oudercontacten");
    const data = await res.json();
    setOudercontacten(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/oudercontacten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, period: "" }), // vaste lege string voor nu
    });

    if (res.ok) {
      setForm({ title: "", date: "", schoolYear: schooljaarOpties()[0] });
      fetchData();
    }
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📆 Oudercontactbeheer</h1>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
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

0~<h2 className="text-xl font-semibold mb-2">📋 Bestaande oudercontacten</h2>
<ul className="space-y-2">
  {oudercontacten.map((oc) => (
    <li key={oc.id} className="border p-2 rounded flex justify-between items-center">
      <div>
        <strong>{oc.title}</strong> ({oc.schoolYear}) –{" "}
        {new Date(oc.date).toLocaleDateString("nl-BE")}
      </div>
      <a
        href={`/oudercontacten/${oc.id}`}
        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
      >
        Ga naar checklist
      </a>
    </li>
  ))}
</ul>

    </main>
  );
}
