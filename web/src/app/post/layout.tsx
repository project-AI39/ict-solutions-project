import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "イベント投稿",
  description: "ユーザーがイベントを投稿・共有できるアプリです。",
};

// ヘッダーとフッターを削除し、コンテンツ（children）のみを返すように修正します。
export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main
        className={`container mx-auto p-0 ${inter.className} bg-gray-100 min-h-screen`}
        suppressHydrationWarning
      >
        {children}
      </main>
    </>
  );
}