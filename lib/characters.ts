// ── 服设套装 ──
export interface OutfitSet {
  id: string;
  name: string;       // 套装名称（如「日常服」「战斗服」）
  images: string[];   // 每套 3 张图（URL 数组）
}

// ── 稿件图 ──
export interface Artwork {
  id: string;
  url: string;
  title?: string;
}

// ── 年度稿件 ──
export interface AnnualArtwork {
  id: string;       // 格子ID，固定 0-8
  url: string;      // 图片URL，空字符串表示未上传
}

// 年度稿件固定 9 格（3×3 九宫格）
export const ANNUAL_GRID_SIZE = 9;

// 把任意长度的年度稿件数组补齐/截断为 9 格（兼容旧 6 格数据）
export function normalizeAnnualArtworks(arr?: string[]): string[] {
  return Array.from({ length: ANNUAL_GRID_SIZE }, (_, i) => arr?.[i] || "");
}

// ── 角色 ──
export interface Character {
  id: string;
  name: string;
  age: string;
  anchor: string;           // 锚点
  worldDescription: string;  // 世界观简述
  portrait: string;          // 立绘（人设整体图片）
  outfits: OutfitSet[];       // 服设套装（至少3套，可加）
  artworks: Artwork[];       // 稿件展示（最多9张，用于九宫格）
  annualArtworks: string[];  // 年度稿件（固定9张，4:3比例，3×3九宫格）
  creatorId: string;
}

// ── 示例数据 ──
export const sampleCharacters: Character[] = [
  {
    id: "sample-01",
    name: "示例角色",
    age: "17",
    anchor: "星屑少女",
    worldDescription: "一个被星尘凝结而成的少女，在星语界中行走，收集散落的星光。",
    portrait: "",
    outfits: [
      { id: "o1", name: "日常服", images: [] },
      { id: "o2", name: "战斗服", images: [] },
      { id: "o3", name: "礼服", images: [] },
    ],
    artworks: [],
    annualArtworks: ["", "", "", "", "", "", "", "", ""],
    creatorId: "",
  },
];