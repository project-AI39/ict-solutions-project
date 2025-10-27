// src/components/CommentsSection.tsx
"use client";
import * as React from "react";

type Comment = {
  id: string;
  body: string;
  createdAt: string; // ISO
  author: { username: string | null } | null;
};

export default function CommentsSection({ eventId }: { eventId: string }) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [text, setText] = React.useState("");
  const [posting, setPosting] = React.useState(false);

  // JSONを安全に読む（204 / 空レスポンスでも落ちない）
  async function safeJson<T = any>(res: Response): Promise<T | null> {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const raw = await res.text(); // 空でもOK
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    }
    try { return await res.json(); } catch { return null; }
  }

  const fetchComments = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/comments?take=30`, { credentials: "include" });
      const data = await safeJson<{ comments: Comment[] }>(res);
      if (!res.ok) throw new Error(data && (data as any).message || "コメントの取得に失敗しました");
      setComments(data?.comments ?? []);   // ★ 0件なら空配列
    } catch (e: any) {
      setError(e.message || "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => { fetchComments(); }, [fetchComments]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body }),
      });
      const data = await safeJson<{ comment: Comment }>(res);
      if (!res.ok) throw new Error(data && (data as any).message || "投稿に失敗しました");
      if (data?.comment) {
        // 新しい順：先頭に追加
        setComments((prev) => [data.comment, ...prev]);
      }
      setText("");
    } catch (e: any) {
      alert(e.message || "投稿に失敗しました");
    } finally {
      setPosting(false);
    }
  }

  return (
    // ★ ここで黒文字をベースに
    <section className="mt-8 text-black">
      <h2 className="text-lg font-semibold mb-3 text-black">コメント</h2>

      {loading ? (
        <p className="text-sm text-black">読み込み中...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : comments.length === 0 ? (
        // ★ 0件表示
        <p className="text-sm text-black">まだコメントはありません。</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => {
            const d = new Date(c.createdAt);
            return (
              <li key={c.id} className="rounded-lg border border-gray-200 p-3">
                <div className="text-sm text-black mb-1">
                  {c.author?.username ?? "unknown"} ・ {d.toLocaleString()}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-black">{c.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      {/* 投稿フォーム（最下部） */}
      <form
        onSubmit={onSubmit}
        className="mt-6 sticky bottom-0 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 py-3"
      >
        <div className="flex gap-2">
          {/* 入力中テキストは黒。placeholderはブラウザ既定で薄い灰ですが、必要ならCSSで黒に変更可 */}
          <textarea
            className="flex-1 rounded-lg border border-gray-300 p-2 min-h-[72px] outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="コメントを書く…"
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className="h-[40px] self-end rounded-lg bg-blue-600 text-white px-4 disabled:opacity-50"
          >
            {posting ? "投稿中..." : "投稿"}
          </button>
        </div>
        <div className="text-xs text-black mt-1">1000文字まで</div>
      </form>
    </section>
  );
}
