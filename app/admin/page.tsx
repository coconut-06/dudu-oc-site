"use client";
 
import { useState, useEffect, useCallback } from "react";
import type { Character } from "@/lib/characters";
import CharacterForm from "@/app/components/CharacterForm";

interface CurrentUser {
  id: string;
  username: string;
  nickname: string;
  isAdmin: boolean;
}

export default function AdminPage() {
  const [characters, setCharacters] = useState<(Character & { creatorNickname?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Character | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchCharacters();
  }, []);

  async function fetchCurrentUser() {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setUser(data.user);
    setUserChecked(true);
  }

  const fetchCharacters = useCallback(async () => {
    const res = await fetch("/api/characters");
    const data = await res.json();
    setCharacters(data);
    setLoading(false);
  }, []);

  function handleNew() {
    setEditing(null);
    setShowForm(true);
  }

  function handleEdit(c: Character) {
    setEditing(c);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这个角色吗？此操作不可撤销。")) return;
    const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
    if (res.status === 401) { alert("请先登录"); window.location.href = "/login"; return; }
    fetchCharacters();
  }

  async function handleSave(formData: Partial<Character>) {
    if (editing) {
      await fetch(`/api/characters/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } else {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.status === 401) { alert("请先登录"); window.location.href = "/login"; return; }
    }
    setShowForm(false);
    setEditing(null);
    fetchCharacters();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function canEdit(c: Character) {
    if (!user) return false;
    if (user.isAdmin) return true;
    return c.creatorId === user.id;
  }

  if (userChecked && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <span className="text-4xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold text-gray-800">需要登录</h1>
          <p className="mt-2 text-sm text-gray-500">登录后才能创建和管理你的 OC 角色</p>
          <div className="mt-6 flex flex-col gap-2">
            <a href="/login" className="rounded-full bg-pink-200 py-2.5 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-300">去登录</a>
            <a href="/register" className="rounded-full border border-pink-200 py-2.5 text-sm text-pink-400 transition-colors hover:bg-pink-50">注册新账号</a>
            <a href="/" className="mt-2 text-xs text-gray-400 hover:text-gray-500">← 回到首页</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">DUDU</span>
            <span className="text-sm text-gray-400">{user?.isAdmin ? "管理后台" : "我的角色"}</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-500">
                {user.nickname}
                {user.isAdmin && <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">管理员</span>}
              </span>
            )}
            <a href="/" className="rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">← 回到前台</a>
            <button onClick={handleLogout} className="rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50">退出</button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user?.isAdmin ? "全部角色" : "我的角色"}</h1>
            <p className="mt-1 text-sm text-gray-400">{user?.isAdmin ? "管理员可以管理所有用户创建的角色" : "只有你自己创建的角色会显示在这里"}</p>
          </div>
          <button onClick={handleNew} className="rounded-full bg-pink-200 px-5 py-2 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-300">+ 新建角色</button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">加载中...</p>
        ) : characters.length === 0 ? (
          <p className="text-center text-gray-400">还没有角色，点击「新建角色」开始吧</p>
        ) : (
          <div className="space-y-3">
            {characters.map((c) => (
              <div key={c.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-pink-50">
                  {c.portrait ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={c.portrait} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-gray-300">{c.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold text-gray-800">{c.name}</span>
                    <span className="text-xs text-gray-400">{c.age}岁 · {c.anchor}</span>
                    {user?.isAdmin && c.creatorNickname && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">by {c.creatorNickname}</span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-gray-400">{c.worldDescription}</p>
                  <p className="mt-0.5 text-xs text-gray-300">服设 {c.outfits.length} 套 · 稿件 {c.artworks.length} 张</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {canEdit(c) ? (
                    <>
                      <button onClick={() => handleEdit(c)} className="rounded-lg border border-pink-200 px-3 py-1.5 text-sm text-pink-400 transition-colors hover:bg-pink-50">编辑</button>
                      <button onClick={() => handleDelete(c.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-500 transition-colors hover:bg-rose-50">删除</button>
                    </>
                  ) : (
                    <span className="self-center text-xs text-gray-300">他人创建</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <CharacterForm character={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}
    </main>
  );
}
