"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function useAuthCheck() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // チェック中フラグ
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    // ページマウント時にAPI呼び出し
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data); // ユーザ情報（例：{ username: "hoge" }）を保存
        } else {
          router.push("/login"); // 未認証ならログインへ
        }
      } catch (err) {
        console.error("認証チェック失敗:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return { user, loading };
}
