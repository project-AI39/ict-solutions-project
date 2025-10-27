import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "イベント投稿",
  description: "ユーザーがイベントを投稿・共有できるアプリです。",
};

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto text-xl font-semibold">
          イベント投稿
        </div>
      </header>

      <main
        className={`container mx-auto p-4 ${inter.className} bg-gray-100 min-h-screen`}
        suppressHydrationWarning
      >
        {children}
      </main>

      <footer className="bg-gray-200 text-center py-4 mt-8 text-sm text-gray-600">
        © 2025 まいぞーん
      </footer>
    </>
  );
}
