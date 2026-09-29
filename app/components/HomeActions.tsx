"use client";

import { useState } from "react";
import type { Character } from "@/lib/characters";
import CharacterForm from "./CharacterForm";

interface HomeActionsProps {
  user: { id: string; username: string; nickname: string; isAdmin: boolean } | null;
}

export default function HomeActions({ user }: HomeActionsProps) {
  const [showForm, setShowForm] = useState(false);

  async function handleSave(formData: Partial<Character>) {
    const res = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.status === 401) {
      alert("请先登录");
      window.location.href = "/login";
      return;
    }
    setShowForm(false);
    // 创建成功后刷新页面以显示新角色
    window.location.reload();
  }

  // 未登录时显示注册引导
  if (!user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="rounded-full bg-pink-400 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-500"
      >
        + 新建角色
      </button>

      {showForm && (
        <CharacterForm
          character={null}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </>
  );
}
