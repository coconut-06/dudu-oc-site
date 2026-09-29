"use client";

import { useState, useRef, useCallback } from "react";

interface ArtworkItem {
  url: string;
}

interface Props {
  artworks: ArtworkItem[];
  characterName: string;
}

export default function ArtworkGrid({ artworks, characterName }: Props) {
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 九宫格导出：3x3 拼接图片
  const handleExportGrid = useCallback(async () => {
    if (artworks.length === 0) return;
    setExporting(true);

    try {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      // 每格 400px，总图 1200x1200
      const CELL = 400;
      const SIZE = CELL * 3;
      canvas.width = SIZE;
      canvas.height = SIZE;

      // 浅灰背景
      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(0, 0, SIZE, SIZE);

      // 加载所有图片
      const images = await Promise.all(
        artworks.slice(0, 9).map(
          (art) =>
            new Promise<{ img: HTMLImageElement; ok: boolean }>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve({ img, ok: true });
              img.onerror = () => resolve({ img, ok: false });
              img.src = art.url;
            })
        )
      );

      // 逐格绘制（4:3 比例裁剪填入正方形格子）
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = col * CELL;
        const y = row * CELL;

        if (i < images.length && images[i].ok) {
          const img = images[i].img;
          // cover 模式：等比裁剪填满
          const scale = Math.max(CELL / img.width, CELL / img.height);
          const sw = img.width;
          const sh = img.height;
          const dw = sw * scale;
          const dh = sh * scale;
          ctx.drawImage(img, x + (CELL - dw) / 2, y + (CELL - dh) / 2, dw, dh);
        } else {
          // 空白格
          ctx.fillStyle = "#f3f4f6";
          ctx.fillRect(x, y, CELL, CELL);
        }
      }

      // 导出
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${characterName}-九宫格.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");

      setExporting(false);
    } catch {
      alert("导出失败，请重试");
      setExporting(false);
    }
  }, [artworks, characterName]);

  return (
    <div>
      {/* 稿件网格（4:3 比例展示） */}
      <div className="grid grid-cols-3 gap-3">
        {artworks.slice(0, 9).map((art, i) => (
          <div
            key={i}
            className="relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.url} alt={`稿件 ${i + 1}`} className="h-full w-full object-cover" />
          </div>
        ))}
        {/* 不足 9 张的空位 */}
        {artworks.length < 9 &&
          Array.from({ length: 9 - artworks.length }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50" />
          ))}
      </div>

      {/* 九宫格导出按钮 */}
      {artworks.length > 0 && (
        <div className="mt-5 text-center">
          <button
            onClick={handleExportGrid}
            disabled={exporting}
            className="rounded-full bg-pink-400 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pink-500 disabled:opacity-50"
          >
            {exporting ? "导出中..." : "下载九宫格图片"}
          </button>
          <p className="mt-2 text-xs text-gray-400">
            将 {Math.min(artworks.length, 9)} 张稿件拼成 3×3 九宫格导出为 PNG 图片
          </p>
        </div>
      )}

      {/* 隐藏的 Canvas 用于拼接 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}