"use client";

import { useState } from "react";

interface CharacterInfo {
  id: string;
  name: string;
  portrait: string;
  annualArtworks: string[];
  creatorId: string;
}

interface UserInfo {
  id: string;
  isAdmin: boolean;
}

interface Props {
  characters: CharacterInfo[];
  user: UserInfo | null;
}

export default function HomeAnnualModule({ characters, user }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [artworksMap, setArtworksMap] = useState<Record<string, string[]>>(
    Object.fromEntries(
      characters.map((c) => [
        c.id,
        c.annualArtworks?.length === 6 ? c.annualArtworks : ["", "", "", "", "", ""],
      ])
    )
  );
  const [uploading, setUploading] = useState<number | null>(null);

  const selected = characters[selectedIdx];
  if (!selected) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-300">暂无角色，请先创建角色</p>
      </div>
    );
  }

  const canEdit = user ? (user.isAdmin || selected.creatorId === user.id) : false;
  const artworks = artworksMap[selected.id] || ["", "", "", "", "", ""];

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) return data.url;
    throw new Error(data.error || "上传失败");
  }

  async function handleUpload(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(idx);
    try {
      const url = await uploadImage(file);
      const current = artworksMap[selected.id] || ["", "", "", "", "", ""];
      const newArtworks = [...current];
      newArtworks[idx] = url;
      setArtworksMap((prev) => ({ ...prev, [selected.id]: newArtworks }));
      await fetch(`/api/characters/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annualArtworks: newArtworks }),
      });
    } catch {
      alert("上传失败");
    }
    setUploading(null);
    e.target.value = "";
  }

  async function handleRemove(idx: number) {
    if (!confirm("确定删除这张年度稿件吗？")) return;
    const current = artworksMap[selected.id] || ["", "", "", "", "", ""];
    const newArtworks = [...current];
    newArtworks[idx] = "";
    setArtworksMap((prev) => ({ ...prev, [selected.id]: newArtworks }));
    await fetch(`/api/characters/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ annualArtworks: newArtworks }),
    });
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest text-gray-400">年 度 稿 件</h2>
        {/* 角色选择器 */}
        <select
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-pink-200 focus:outline-none"
        >
          {characters.map((c, i) => (
            <option key={c.id} value={i}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {artworks.map((url, i) => (
          <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
            {url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`年度稿件 ${i + 1}`} className="h-full w-full object-cover" />
                {canEdit && (
                  <button
                    onClick={() => handleRemove(i)}
                    className="absolute right-1 top-1 rounded-bl-lg bg-black/50 px-1.5 py-0.5 text-xs text-white hover:bg-black/70"
                  >
                    ✕
                  </button>
                )}
              </>
            ) : canEdit ? (
              <label className="flex h-full w-full cursor-pointer items-center justify-center text-gray-300 hover:border-pink-200 hover:text-pink-300">
                {uploading === i ? (
                  <span className="text-xs text-pink-300">上传中...</span>
                ) : (
                  <span className="text-xs">+</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpload(i, e)}
                />
              </label>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-200">
                <span className="text-xs">—</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
