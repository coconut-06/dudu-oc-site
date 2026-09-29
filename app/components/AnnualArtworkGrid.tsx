"use client";

import { useState, useRef } from "react";

interface Props {
  characterId: string;
  annualArtworks: string[];
  canEdit: boolean;
}

export default function AnnualArtworkGrid({ characterId, annualArtworks, canEdit }: Props) {
  const [artworks, setArtworks] = useState<string[]>(annualArtworks);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      const newArtworks = [...artworks];
      newArtworks[idx] = url;
      setArtworks(newArtworks);
      // 保存到服务器
      await fetch(`/api/characters/${characterId}`, {
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
    const newArtworks = [...artworks];
    newArtworks[idx] = "";
    setArtworks(newArtworks);
    await fetch(`/api/characters/${characterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ annualArtworks: newArtworks }),
    });
  }

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold tracking-widest text-gray-400">年 度 稿 件</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {artworks.map((url, i) => (
          <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
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
              <label className="flex h-full w-full cursor-pointer items-center justify-center text-gray-300 hover:border-pink-300 hover:text-pink-300">
                {uploading === i ? (
                  <span className="text-xs text-pink-400">上传中...</span>
                ) : (
                  <span className="text-xs">+ 上传</span>
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
                <span className="text-xs">暂无</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
