"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, remember }),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      // Remember Me に応じて保存方法を変更
      if (remember) localStorage.setItem("token", data.token);
      else sessionStorage.setItem("token", data.token);

      router.push("/dashboard");
    } else {
      setError("ユーザー名またはパスワードが間違っています");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-lg shadow-lg"
      >
        <div className="flex justify-center mb-4">
          <img className="w-30 h-30 rounded-full" src="/login/icon.png" alt="アプリアイコン" />
        </div>

	
        <h2 className="text-2xl font-bold mb-6 text-black text-center">ログイン</h2>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <input
          type="text"
          placeholder="ユーザー名"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          required
          className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 text-black"
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          required
          className="w-full mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 text-black"
        />
        <div className="flex justify-end text-sm text-blue-500 mb-4">
          <a href="/forgot-password" className="hover:underline">
            パスワードをお忘れですか？
          </a>
	</div>

        {/* Remember Me */}
        <label className="flex items-center mb-6 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="mr-2"
          />
          ログイン状態を保存する
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded transition mb-4"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
	
        <div className="flex flex-col items-center gap-2 mt-0">
          <p className="text-black text-center">または</p>
          <a href="/user_registerUI" className="text-blue-500 hover:underline text-center">
            新規登録
          </a>
        </div>

      </form>
    </div>
  );
}
