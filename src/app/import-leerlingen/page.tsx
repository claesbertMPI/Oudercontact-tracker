"use client";

import { useState } from "react";

export default function ImportLeerlingenPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/import-leerlingen");
      const data = await res.json();

      if (res.ok) {
        setResult(data.message);
      } else {
        setResult(`Fout: ${data.error}`);
      }
    } catch (err) {
      setResult("⚠ Er ging iets mis bij het ophalen.");
    }

    setLoading(false);
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">📥 Importeer leerlingen vanuit WISA</h1>
      <button
        onClick={handleImport}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Bezig met importeren..." : "Start import"}
      </button>

      {result && (
        <p className="mt-4 text-lg text-gray-800">{result}</p>
      )}
    </main>
  );
}
