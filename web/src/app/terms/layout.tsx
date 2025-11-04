export default function SampleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* ヘッダー */}
      <header className="p-4 bg-gray-800 text-white text-center">
        <h1 className="text-lg font-bold">利用規約</h1>
      </header>

      {/* ページの中身 */}
      <main className="p-6">{children}</main>

      {/* フッター */}
      <footer className="p-4 text-center text-sm text-gray-500">
        © 2025 まいぞーん
      </footer>
    </div>
  );
}