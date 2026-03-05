"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

export default function DeleteOudercontactButton({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onClick() {
    if (loading) return;
    const ok = window.confirm(
      `Ben je zeker dat je "${title}" (ID ${id}) wil verwijderen?\nAlle aanwezigheden gekoppeld aan dit oudercontact worden ook verwijderd.`
    );
    if (!ok) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/oudercontacten/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (err) {
      alert(`Verwijderen mislukt: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-3 py-1 rounded text-sm border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-60"
      title="Verwijder oudercontact"
    >
      {loading ? "Verwijderen…" : "Verwijder"}
    </button>
  );
}
