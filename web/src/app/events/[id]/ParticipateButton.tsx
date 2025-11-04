// src/app/events/[id]/ParticipateButton.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IS_TEST_CLIENT, FORCE_TOKYO, TEST_BADGE_TEXT, TOKYO_ST } from "@/lib/testFlags";

const METERS_ALLOWED = 10;
const POINTS_PER_JOIN = 10;

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type Props = {
  eventId: string;
  eventLat: number;
  eventLng: number;
  authorId: string | null; // ★ 追加
};

export default function ParticipateButton({ eventId, eventLat, eventLng, authorId }: Props) {
  // ==== TEST-ONLY ====
  const [forceTokyo, setForceTokyo] = useState<boolean>(IS_TEST_CLIENT && FORCE_TOKYO);
  const [mounted, setMounted] = useState(false);

  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { awarded: number }>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (IS_TEST_CLIENT) {
      const saved = window.localStorage.getItem("testForceGPS");
      if (saved === "tokyo") setForceTokyo(true);
      if (saved === "off") setForceTokyo(false);
    }
  }, []);

  useEffect(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (forceTokyo && IS_TEST_CLIENT) {
      setCoords({ lat: TOKYO_ST.lat, lng: TOKYO_ST.lng, accuracy: 1 });
      setError(null);
      if (mounted) window.localStorage.setItem("testForceGPS", "tokyo");
      return;
    }
    if (!("geolocation" in navigator)) {
      setError("この端末は位置情報に対応していません。");
      if (mounted) window.localStorage.setItem("testForceGPS", "off");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? NaN,
        });
      },
      (e) => setError(e.message || "位置情報の取得に失敗しました。"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    watchIdRef.current = id;
    if (mounted) window.localStorage.setItem("testForceGPS", "off");
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [forceTokyo, mounted]);

  const distance = useMemo(() => {
    if (!coords) return Infinity;
    return haversineMeters(coords.lat, coords.lng, eventLat, eventLng);
  }, [coords, eventLat, eventLng]);

  const canJoinByDistance = Number.isFinite(distance) && distance <= METERS_ALLOWED;

  // ★ 現在ユーザーIDだけ軽量取得（ボタンの表示制御用）
  const [me, setMe] = useState<{ id: string } | null>(null);
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d?.user ? { id: d.user.id } : null))
      .catch(() => setMe(null));
  }, []);

  const isOwner = !!(authorId && me?.id && authorId === me.id);

  async function onJoin() {
    if (!coords || isOwner) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
          __testForce: forceTokyo ? "tokyo" : undefined, // TEST-ONLY
        }),
      });

      if (res.status === 409) {
        setDone({ awarded: 0 });
        window.dispatchEvent(new CustomEvent("points:updated"));
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `参加に失敗しました（${res.status}）`);
      }

      const data = await res.json();
      setDone({ awarded: data?.awarded ?? POINTS_PER_JOIN });
      window.dispatchEvent(new CustomEvent("points:updated"));
    } catch (e: any) {
      setError(e?.message ?? "参加処理でエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  const distLabel = Number.isFinite(distance) ? `${Math.round(distance)} m` : "—";

  // ★ 文言の分岐（優先度：主催者 > 完了 > ローディング > 距離 > 参加可能）
  const buttonLabel =
    isOwner
      ? "主催者は参加できません"
      : done
      ? "参加済み"
      : loading
      ? "参加中…"
      : !canJoinByDistance
      ? "開催場所に近づいてください"
      : "このイベントに参加する";

  const disabled = isOwner || !canJoinByDistance || loading || !!done;

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
      <div className="text-xs text-black/70 text-right">
        現在地との距離: <span className="font-semibold">{distLabel}</span>
        {coords?.accuracy ? <span>（精度 ±{Math.round(coords.accuracy)} m）</span> : null}
      </div>

      <button
        onClick={onJoin}
        disabled={disabled}
        className={`w-full sm:w-auto px-4 py-3 rounded-xl text-white text-base font-semibold transition ${
          !disabled ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
        }`}
        aria-disabled={disabled}
      >
        {buttonLabel}
      </button>

      {/* ==== TEST-ONLY: テスト設定UI（折りたたみ）=========== */}
      {IS_TEST_CLIENT && (
        <details className="w-full sm:w-auto" data-test-only>
          <summary className="text-xs text-black/70 cursor-pointer select-none">
            {TEST_BADGE_TEXT} 設定を表示
          </summary>
        <div className="mt-2 flex flex-col items-start sm:items-end gap-1">
            {mounted && forceTokyo && (
              <div className="text-[10px] px-2 py-1 rounded-full bg-yellow-300 text-black font-semibold">
                {TEST_BADGE_TEXT}: 現在地=東京駅
              </div>
            )}
            <label className="flex items-center gap-2 text-xs text-black/80 select-none">
              <input
                type="checkbox"
                checked={forceTokyo}
                onChange={(e) => setForceTokyo(e.target.checked)}
              />
              <span className="font-medium">現在地を東京駅に固定</span>
            </label>
          </div>
        </details>
      )}
      {/* ==== TEST-ONLY: ここまで =============================== */}

      {error && <div className="text-xs text-red-600 text-right">{error}</div>}
      {done && (
        <div className="text-xs text-green-700 text-right">
          参加を記録しました。{done.awarded ? `+${done.awarded}ポイント付与。` : "（既参加）"}
        </div>
      )}
    </div>
  );
}
