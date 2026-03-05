"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function SchoolYearFilter({
  id,
  years,
  value,
}: {
  id?: string;
  years: string[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sj", e.target.value);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="border rounded px-2 py-1"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
