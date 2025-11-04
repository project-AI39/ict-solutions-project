import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CommentsSection from "@/components/CommentsSection";

export const dynamic = "force-dynamic";

export default async function EventDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ev = await prisma.event.findUnique({
    where: { id },
    include: { author: { select: { username: true } } },
  });
  if (!ev) return notFound();

  const date = new Date(ev.createdAt);
  const authorName = ev.author?.username ?? "unknown";
  const hasImage = ev.imageUrl && ev.imageUrl.trim() !== "";

  // ★ 「YYYY/MM/DD HH:mm」形式で表示
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

      <h1 className="text-2xl font-semibold mb-2 text-black">{ev.title}</h1>

      {/* ★ 日付を YYYY/MM/DD HH:mm 形式で表示 */}
      <p className="text-sm text-black mb-4">
        by {authorName} ・ {formattedDate}
      </p>

      {hasImage && (
        <div className="relative w-full h-64 mb-4">
          <Image
            // public 配下の相対パスが入る想定なので先に正規化しておく
            src={ev.imageUrl!.startsWith("/") ? ev.imageUrl! : `/${ev.imageUrl!}`}
            alt={ev.title}
            fill
            className="object-cover rounded-xl"
            // 一時的に Next.js の最適化をバイパスして配信経路の問題を切り分ける
            unoptimized
          />
        </div>
      )}

      {ev.description && (
        <p className="leading-relaxed whitespace-pre-wrap text-black">
          {ev.description}
        </p>
      )}

      <CommentsSection eventId={id} />
    </main>
  );
}
