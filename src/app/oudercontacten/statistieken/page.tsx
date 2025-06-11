// src/app/oudercontacten/statistieken/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PerWijzerCharts from "@/components/PerWijzerCharts";

interface Oudercontact {
  id: number;
  title: string;
  date: string;
}

interface KlasStats {
  klas: string;
  percentage: number;
}

interface WijzerStats {
  wijzer: string;
  percentage: number;
}

export default function MultiStatistiekenPage() {
  const [oudercontacten, setOudercontacten] = useState<Oudercontact[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [perKlas, setPerKlas] = useState<KlasStats[]>([]);
  const [perWijzer, setPerWijzer] = useState<WijzerStats[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch the list of oudercontacten
  useEffect(() => {
    fetch("/api/oudercontacten")
      .then((res) => res.json())
      .then((data: Oudercontact[]) => setOudercontacten(data));
  }, []);

  // Toggle selection
  const toggle = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Generate average stats
  const generate = async () => {
    const ids = oudercontacten
      .filter((oc) => selected[oc.id])
      .map((oc) => oc.id);
    if (ids.length === 0) return;

    setLoading(true);
    const res = await fetch("/api/statistieken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oudercontactIds: ids }),
    });
    const json = (await res.json()) as {
      perKlas: KlasStats[];
      perWijzer: WijzerStats[];
    };
    setPerKlas(json.perKlas);
    setPerWijzer(json.perWijzer);
    setLoading(false);
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <Link href="/oudercontacten" className="text-blue-600 hover:underline">
        ← Terug naar overzicht
      </Link>

      <h1 className="text-2xl font-bold my-4">
        Statistieken over meerdere oudercontacten
      </h1>

      <div className="border p-4 rounded mb-4">
        {oudercontacten.map((oc) => (
          <label key={oc.id} className="block">
            <input
              type="checkbox"
              checked={!!selected[oc.id]}
              onChange={() => toggle(oc.id)}
              className="mr-2"
            />
            {oc.title} ({new Date(oc.date).toLocaleDateString()})
          </label>
        ))}

        <button
          onClick={generate}
          disabled={loading}
          className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Laden…" : "Genereer grafieken"}
        </button>
      </div>

      {perWijzer.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-4">
            📊 Aanwezigheid per wijzer (gemiddeld)
          </h2>
          <PerWijzerCharts perKlas={perKlas} perWijzer={perWijzer} />
        </>
      )}
    </main>
  );
}
