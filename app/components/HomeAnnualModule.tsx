"use client";

import { useState, useRef, useCallback } from "react";
import { normalizeAnnualArtworks } from "@/lib/characters";

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
      characters.map((c) => [c.id, normalizeAnnualArtworks(c.annualArtworks)])
    )
  );
  const [uploading, setUploading] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selected = characters[selectedIdx];
  if (!selected) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-300">先创建角色后即可使用年度稿件</p>
      </div>
    );
  }

  const canEdit = user ? (user.isAdmin || selected.creatorId === user.id) : false;
  const artworks = normalizeAnnualArtworks(artworksMap[selected.id]);
  const filledCount = artworks.filter((u) => u).length;

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    let res: Response;
    try {
      res = await fetch("/api/upload", { method: "POST", body: fd });
    } catch {
      throw new Error("无法连接上传接口，请检查网络后重试");
    }
    const data = await res.json().catch(() => null);
    if (res.ok && data?.url) return data.url;
    throw new Error(data?.error || `上传接口错误(${res.status})`);
  }

  async function saveArtworks(characterId: string, newArtworks: string[]): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`/api/characters/${characterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annualArtworks: newArtworks }),
      });
    } catch {
      throw new Error("无法连接保存接口，请检查网络后重试");
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const reason = data?.error || res.status === 401 ? "登录已过期，请重新登录" : `保存失败(${res.status})`;
      throw new Error(reason);
    }
  }

  async function handleUpload(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(idx);
    try {
      const url = await uploadImage(file);
      const current = normalizeAnnualArtworks(artworksMap[selected.id]);
      const newArtworks = [...current];
      newArtworks[idx] = url;
      try {
        await saveArtworks(selected.id, newArtworks);
        // 保存成功后才更新界面
        setArtworksMap((prev) => ({ ...prev, [selected.id]: newArtworks }));
      } catch (saveErr) {
        // 保存失败：回滚界面，提示具体原因
        alert(saveErr instanceof Error ? saveErr.message : "保存失败，请重试");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "上传失败");
    }
    setUploading(null);
    e.target.value = "";
  }

  async function handleRemove(idx: number) {
    if (!confirm("确定删除这张年度稿件吗？")) return;
    const current = normalizeAnnualArtworks(artworksMap[selected.id]);
    const newArtworks = [...current];
    newArtworks[idx] = "";
    try {
      await saveArtworks(selected.id, newArtworks);
      setArtworksMap((prev) => ({ ...prev, [selected.id]: newArtworks }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败，请重试");
    }
  }

  // 导出九宫格拼接图（每格竖版4:3，整体 3:4，与页面呈现一致）
  const handleExportGrid = useCallback(async () => {
    if (filledCount === 0) return;
    setExporting(true);
    try {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      // 每格宽 300 高 400（竖版 4:3），总图 900宽×1200高，比例 3:4
      const CELL_W = 300;
      const CELL_H = 400;
      canvas.width = CELL_W * 3;
      canvas.height = CELL_H * 3;

      // 白色背景
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 加载所有图片
      const images = await Promise.all(
        artworks.map(
          (url) =>
            new Promise<{ img: HTMLImageElement; ok: boolean }>((resolve) => {
              if (!url) return resolve({ img: new Image(), ok: false });
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve({ img, ok: true });
              img.onerror = () => resolve({ img, ok: false });
              img.src = url;
            })
        )
      );

      // 逐格绘制（cover 模式：等比裁剪填满竖版 4:3 格子）
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = col * CELL_W;
        const y = row * CELL_H;

        if (images[i].ok) {
          const img = images[i].img;
          const scale = Math.max(CELL_W / img.width, CELL_H / img.height);
          const sw = img.width;
          const sh = img.height;
          const dw = sw * scale;
          const dh = sh * scale;
          ctx.drawImage(img, x + (CELL_W - dw) / 2, y + (CELL_H - dh) / 2, dw, dh);
        } else {
          // 空白格填充浅灰
          ctx.fillStyle = "#f3f4f6";
          ctx.fillRect(x, y, CELL_W, CELL_H);
        }
      }

      // 导出
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selected.name}-年度九宫格.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");

      setExporting(false);
    } catch {
      alert("导出失败，请重试");
      setExporting(false);
    }
  }, [artworks, selected.name]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* 模块标题 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest text-gray-400">年 度 稿 件</h2>
        {characters.length > 1 && (
          <select
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-pink-200 focus:outline-none"
          >
            {characters.map((c, i) => (
              <option key={c.id} value={i}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* 当前角色提示 */}
      <p className="mb-3 text-xs text-gray-300">{selected.name} 的年度稿件</p>

      {/* 9 格年度稿件（3×3，限宽后按比例缩小） */}
      <div className="grid grid-cols-3 gap-1.5">
        {artworks.map((url, i) => (
          <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
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

      {/* 导出九宫格按钮 */}
      {filledCount > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={handleExportGrid}
            disabled={exporting}
            className="rounded-full bg-pink-200 px-5 py-2 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-300 disabled:opacity-50"
          >
            {exporting ? "导出中..." : "导出 4:3 九宫格"}
          </button>
          <p className="mt-1.5 text-xs text-gray-300">
            将 {filledCount} 张年度稿件拼成 3×3 竖版大图（900×1200 PNG）
          </p>
        </div>
      )}

      {!canEdit && (
        <p className="mt-3 text-center text-xs text-gray-300">登录后可上传管理</p>
      )}

      {/* 隐藏的 Canvas 用于拼接 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
