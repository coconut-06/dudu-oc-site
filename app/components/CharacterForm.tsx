"use client";

import { useState } from "react";
import type { Character, OutfitSet, Artwork } from "@/lib/characters";
import { normalizeAnnualArtworks } from "@/lib/characters";

interface FormProps {
  character: Character | null;
  onSave: (data: Partial<Character>) => Promise<void>;
  onCancel: () => void;
}

export default function CharacterForm({ character, onSave, onCancel }: FormProps) {
  const [saving, setSaving] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState(character?.portrait || "");
  const [outfits, setOutfits] = useState<OutfitSet[]>(character?.outfits?.length ? character.outfits : [
    { id: "o1", name: "服设1", images: [] },
    { id: "o2", name: "服设2", images: [] },
    { id: "o3", name: "服设3", images: [] },
  ]);
  const [annualArtworks, setAnnualArtworks] = useState<string[]>(normalizeAnnualArtworks(character?.annualArtworks));
  const [artworks, setArtworks] = useState<Artwork[]>(character?.artworks || []);
  const [textForm, setTextForm] = useState({
    name: character?.name || "",
    age: character?.age || "",
    anchor: character?.anchor || "",
    worldDescription: character?.worldDescription || "",
  });

  function update(field: string, value: string) {
    setTextForm((prev) => ({ ...prev, [field]: value }));
  }

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) return data.url;
    throw new Error(data.error || "上传失败");
  }

  async function handlePortraitUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setPortraitUrl(await uploadImage(file)); } catch { alert("上传失败"); }
    e.target.value = "";
  }

  function addOutfit() {
    setOutfits((prev) => [...prev, { id: `o${Date.now()}`, name: `服设${prev.length + 1}`, images: [] }]);
  }

  function removeOutfit(idx: number) {
    setOutfits((prev) => prev.filter((_, i) => i !== idx));
  }

  function renameOutfit(idx: number, name: string) {
    setOutfits((prev) => prev.map((o, i) => i === idx ? { ...o, name } : o));
  }

  async function handleOutfitImageUpload(outfitIdx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setOutfits((prev) => prev.map((o, i) => i === outfitIdx ? { ...o, images: [...o.images, ...urls] } : o));
    } catch { alert("上传失败"); }
    e.target.value = "";
  }

  function removeOutfitImage(outfitIdx: number, imgIdx: number) {
    setOutfits((prev) => prev.map((o, i) => i === outfitIdx ? { ...o, images: o.images.filter((_, j) => j !== imgIdx) } : o));
  }

  async function handleArtworkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (artworks.length + files.length > 9) { alert("稿件最多 9 张"); return; }
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setArtworks((prev) => [...prev, ...urls.map((url, i) => ({ id: `a${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`, url }))]);
    } catch { alert("上传失败"); }
    // 重置 input value，确保可以再次选择同一文件
    e.target.value = "";
  }

  function removeArtwork(idx: number) {
    setArtworks((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleAnnualUpload(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setAnnualArtworks((prev) => prev.map((u, i) => i === idx ? url : u));
    } catch { alert("上传失败"); }
    e.target.value = "";
  }

  function removeAnnualArtwork(idx: number) {
    setAnnualArtworks((prev) => prev.map((u, i) => i === idx ? "" : u));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...textForm,
      portrait: portraitUrl,
      outfits,
      artworks,
      annualArtworks,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-8 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">{character ? "编辑角色" : "新建角色"}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-600">姓名 *</label>
              <input type="text" value={textForm.name} onChange={(e) => update("name", e.target.value)} required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-300" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">年龄 *</label>
              <input type="text" value={textForm.age} onChange={(e) => update("age", e.target.value)} required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-300" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">锚点 *</label>
            <input type="text" value={textForm.anchor} onChange={(e) => update("anchor", e.target.value)} required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-300" placeholder="角色的核心特征/定位" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">世界观简述 *</label>
            <textarea value={textForm.worldDescription} onChange={(e) => update("worldDescription", e.target.value)} required rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-300" />
          </div>

          {/* 立绘 */}
          <div>
            <label className="mb-1 block text-sm text-gray-600">立绘（人设整体图片）</label>
            <div className="flex items-center gap-4">
              <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {portraitUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */ <img src={portraitUrl} alt="立绘" className="h-full w-full object-cover" />
                ) : <span className="text-xs text-gray-400">无图</span>}
              </div>
              <input type="file" accept="image/*" onChange={handlePortraitUpload}
                className="block text-sm text-gray-500 file:mr-3 file:rounded-full file:border-0 file:bg-pink-50 file:px-4 file:py-1.5 file:text-sm file:text-pink-600 hover:file:bg-pink-100" />
            </div>
          </div>

          {/* 服设 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-600">服设套装</label>
              <button type="button" onClick={addOutfit} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200">+ 添加套装</button>
            </div>
            <div className="space-y-3">
              {outfits.map((outfit, oi) => (
                <div key={outfit.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input type="text" value={outfit.name} onChange={(e) => renameOutfit(oi, e.target.value)} placeholder={`服设${oi + 1}`}
                      className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-pink-300 focus:outline-none" />
                    {outfits.length > 1 && (
                      <button type="button" onClick={() => removeOutfit(oi)} className="text-xs text-rose-400 hover:text-rose-500">删除套</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {outfit.images.map((img, ii) => (
                      <div key={ii} className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => removeOutfitImage(oi, ii)}
                          className="absolute right-0 top-0 rounded-bl-lg bg-black/50 px-1.5 py-0.5 text-xs text-white">✕</button>
                      </div>
                    ))}
                    {outfit.images.length < 5 && (
                      <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-300 hover:border-pink-300 hover:text-pink-300">
                        <span className="text-xs">+ 图片</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleOutfitImageUpload(oi, e)} />
                      </label>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-300">{outfit.images.length}/5 张</p>
                </div>
              ))}
            </div>
          </div>

          {/* 稿件展示 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-600">稿件展示（4:3 比例，最多 9 张）</label>
              <span className="text-xs text-gray-400">{artworks.length}/9</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {artworks.map((art, ai) => (
                <div key={art.id} className="relative aspect-[4/3] w-28 overflow-hidden rounded-lg border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art.url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeArtwork(ai)}
                    className="absolute right-0 top-0 rounded-bl-lg bg-black/50 px-1.5 py-0.5 text-xs text-white">✕</button>
                </div>
              ))}
              {artworks.length < 9 && (
                <label className="flex aspect-[4/3] w-28 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-300 hover:border-pink-300 hover:text-pink-300">
                  <span className="text-xs">+ 稿件</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleArtworkUpload} />
                </label>
              )}
            </div>
          </div>

          {/* 年度稿件 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-600">年度稿件（9 格 4:3，首页可导出九宫格）</label>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {annualArtworks.map((url, ai) => (
                <div key={ai} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`年度稿件 ${ai + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeAnnualArtwork(ai)}
                        className="absolute right-0 top-0 rounded-bl-lg bg-black/50 px-1.5 py-0.5 text-xs text-white">✕</button>
                    </>
                  ) : (
                    <label className="flex h-full w-full cursor-pointer items-center justify-center text-gray-300 hover:border-pink-300 hover:text-pink-300">
                      <span className="text-xs">+ 上传</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAnnualUpload(ai, e)} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50">取消</button>
            <button type="submit" disabled={saving} className="rounded-full bg-pink-200 px-5 py-2 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-300 disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
