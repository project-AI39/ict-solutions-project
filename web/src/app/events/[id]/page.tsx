import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ✅ params は Promise なので await してから使う
export default async function EventDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ← ここがポイント

  const ev = await prisma.event.findUnique({
    where: { id },
    include: { author: { select: { username: true } } },
  });
  if (!ev) return notFound();

  const date = new Date(ev.createdAt);
  const authorName = ev.author?.username ?? "unknown";
  const hasImage = ev.imageUrl && ev.imageUrl.trim() !== "";

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <a href="/" className="text-sm underline mb-4 inline-block">← ホームに戻る</a>

      <h1 className="text-2xl font-semibold mb-2">{ev.title}</h1>
      <p className="text-sm text-gray-600 mb-4">
        by {authorName} ・ {date.toLocaleString()}
      </p>

      {/* 画像URLがある場合のみ表示 */}
      {hasImage && (
        <div className="relative w-full h-64 mb-4">
          <Image src={ev.imageUrl!} alt={ev.title} fill className="object-cover rounded-xl" />
        </div>
      )}

      {ev.description && (
        <p className="leading-relaxed whitespace-pre-wrap">{ev.description}</p>
      )}

      <div className="mt-6 text-sm text-gray-600">
        位置: {ev.latitude.toFixed(5)}, {ev.longitude.toFixed(5)}
      </div>
    </main>
  );
}
