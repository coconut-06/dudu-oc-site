"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }
      // 登录成功，跳转后台
      router.push("/admin");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-4xl">✦</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-800">欢迎回来</h1>
          <p className="mt-1 text-sm text-gray-500">登录 DUDU，继续创造你的角色</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm text-gray-600">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-300"
              placeholder="用户名"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-300"
              placeholder="密码"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-pink-200 py-2.5 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-300 disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>

          <p className="text-center text-sm text-gray-400">
            还没有账号？{" "}
            <Link href="/register" className="text-pink-300 hover:underline">
              注册一个
            </Link>
          </p>
          <p className="text-center text-xs text-gray-300">
            <Link href="/" className="hover:text-gray-400">
              ← 回到首页随便逛逛
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}