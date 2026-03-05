0~"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function OudercontactFilter({
  options,
  value,
}: {
  options: { id: number; label: string }[];
  value: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    const next = new URLSearchParams(sp.toString());
    if (!v) next.delete("oc");
    else next.set("oc", v);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <select
      value={value ?? ""}
      onChange={onChange}
      className="border rounded px-2 py-1"
    >
      <option value="">Alle leerlingen</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

