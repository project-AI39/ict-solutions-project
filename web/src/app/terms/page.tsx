import Link from "next/link";

export const metadata = {
  title: "利用規約 – まいぞーん",
  description: "このサービスの利用規約ページです。",
};

export default function TermsPage() {
  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h1>利用規約</h1>
      <p>
        本ウェブサイト（以下「当サイト」といいます）は、ユーザーの皆様により良いサービスを提供するために運営されています。
      </p>

      <h2>第1条（適用）</h2>
      <p>
        本規約は、ユーザーと当サイトの運営者との間の利用に関わる一切の関係に適用されます。
      </p>

      <h2>第2条（禁止事項）</h2>
      <ul>
        <li>法令または公序良俗に違反する行為</li>
        <li>当サイトの運営を妨害する行為</li>
        <li>その他、当サイトが不適切と判断する行為</li>
      </ul>

      <h2>第3条（免責事項）</h2>
      <p>
        当サイトは、提供する情報の正確性・安全性について保証するものではありません。
        利用により生じたいかなる損害についても責任を負いません。
      </p>

      <h2>第4条（規約の変更）</h2>
      <p>
        当サイトは、必要に応じて本規約を変更することができます。
        変更後の規約は、当サイトに掲載された時点で効力を生じます。
      </p>

      <p style={{ marginTop: "2rem" }}>最終更新日: 2025年10月5日</p>

      {/* ホームに戻るボタン */}
      <div style={{ marginTop: "2rem" }}>
        <Link
          href="/user_registerUI"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            backgroundColor: "#333",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none",
          }}
        >
          閉じる
        </Link>
      </div>
    </div>
  );
}
