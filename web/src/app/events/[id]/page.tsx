// src/app/events/[id]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CommentsSection from "@/components/CommentsSection";
import ParticipateButton from "./ParticipateButton";
import PointsBadge from "@/components/PointsBadge";
import { IS_TEST_CLIENT, TEST_BADGE_TEXT } from "@/lib/testFlags";

export const dynamic = "force-dynamic";

export default async function EventDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ev = await prisma.event.findUnique({
    where: { id },
    // ★ author.id も取得して主催者判定に利用する
    include: { author: { select: { id: true, username: true } } },
  });
  if (!ev) return notFound();

  const date = new Date(ev.createdAt);
  const authorName = ev.author?.username ?? "unknown";
  const authorId = ev.author?.id ?? null; // ★ 追加
  const hasImage = ev.imageUrl && ev.imageUrl.trim() !== "";

  const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date
    .getDate()
    .toString()
    .padStart(2, "0")} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 bg-white text-black min-h-screen">
      <a href="/" className="text-sm underline mb-4 inline-block text-black">
        ← ホームに戻る
      </a>

      {IS_TEST_CLIENT && (
        // ==== TEST-ONLY: ページ上部のバナー ====================
        <div
          className="mb-3 text-xs px-3 py-2 rounded-lg bg-yellow-200 text-black font-semibold"
          data-test-only
        >
          {TEST_BADGE_TEXT}: このページにはテスト専用のUIが含まれます（本番では表示されません）
        </div>
        // ==== TEST-ONLY: ここまで ==============================
      )}

      {/* スマホ: 縦並び / PC: 左右 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold mb-1 text-black">{ev.title}</h1>
          <p className="text-sm text-black">
            by {authorName} ・ {formattedDate}
          </p>
        </div>

        {/* 右側：ポイント → 参加ボタン（スマホは縦並び） */}
        <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
          <PointsBadge />
          <ParticipateButton
            eventId={id}
            eventLat={ev.latitude}
            eventLng={ev.longitude}
            authorId={authorId}  // ★ 主催者IDを渡す
          />
        </div>
      </div>

      {hasImage && (
        <div className="relative w-full h-64 mb-4 mt-4">
          <Image
            src={ev.imageUrl!.startsWith("/") ? ev.imageUrl! : `/${ev.imageUrl!}`}
            alt={ev.title}
            fill
            className="object-cover rounded-xl"
            unoptimized
          />
        </div>
      )}

      {ev.description && (
        <p className="leading-relaxed whitespace-pre-wrap text-black mt-4">
          {ev.description}
        </p>
      )}

      <CommentsSection eventId={id} />
    </main>
  );
}
