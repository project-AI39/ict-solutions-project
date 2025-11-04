// src/components/PointsBadge.tsx
"use client";

import { useEffect, useState } from "react";

export default function PointsBadge() {
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchPoints() {
    setLoading(true);
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPoints(data?.user?.points ?? null);
    } catch {
      setPoints(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPoints();
    const handler = () => fetchPoints();
    window.addEventListener("points:updated", handler);
    return () => window.removeEventListener("points:updated", handler);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-900 px-3 py-1 text-sm">
      <span className="font-semibold">あなたのポイント</span>
      <span className="rounded-full bg-white px-2 py-0.5 border border-emerald-300 min-w-[2.5rem] text-center">
        {loading ? "…" : points ?? "—"}
      </span>
      <span className="text-xs text-emerald-700">pt</span>
    </div>
  );
}
