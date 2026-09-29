import Database from "better-sqlite3";
import type { Character, OutfitSet, Artwork } from "@/lib/characters";

// ── 本地 SQLite 数据库（开发用）──
// 上线后切换为 Vercel Postgres，只需改这个文件

let db: Database.Database | null = null;

import path from "path";
const DB_PATH = path.join(process.cwd(), "..", "oc-site-data", "oc-site.db");

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");

    // 用新结构重建角色表（如果旧表存在且结构不符则丢弃重建）
    const cols = db.prepare("PRAGMA table_info(characters)").all() as any[];
    const hasNewSchema = cols.some((c) => c.name === "anchor");
    if (cols.length > 0 && !hasNewSchema) {
      db.exec("DROP TABLE IF EXISTS characters");
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age TEXT NOT NULL,
        anchor TEXT NOT NULL,
        world_description TEXT NOT NULL,
        portrait TEXT DEFAULT '',
        outfits TEXT DEFAULT '[]',
        artworks TEXT DEFAULT '[]',
        creator_id TEXT DEFAULT '',
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        nickname TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

    // 检查是否需要加 annual_artworks 列
    const hasAnnualCol = cols.some((c) => c.name === "annual_artworks");
    if (cols.length > 0 && hasNewSchema && !hasAnnualCol) {
      db.exec("ALTER TABLE characters ADD COLUMN annual_artworks TEXT DEFAULT '[]'");
    }

    // 如果角色表为空，插入一条示例数据
    const count = db.prepare("SELECT COUNT(*) as n FROM characters").get() as { n: number };
    if (count.n === 0) {
      seedDb(db);
    }
  }
  return db;
}

function seedDb(database: Database.Database) {
  const sample: Character = {
    id: "sample-01",
    name: "示例角色",
    age: "17",
    anchor: "星屑少女",
    worldDescription: "一个被星尘凝结而成的少女，在星语界中行走，收集散落的星光。",
    portrait: "",
    outfits: [
      { id: "o1", name: "服设1", images: [] },
      { id: "o2", name: "服设2", images: [] },
      { id: "o3", name: "服设3", images: [] },
    ],
    artworks: [],
    annualArtworks: ["", "", "", "", "", ""],
    creatorId: "",
  };

  database.prepare(`
    INSERT INTO characters (id, name, age, anchor, world_description, portrait, outfits, artworks, annual_artworks, creator_id)
    VALUES (@id, @name, @age, @anchor, @world_description, @portrait, @outfits, @artworks, @annual_artworks, '')
  `).run({
    ...sample,
    outfits: JSON.stringify(sample.outfits),
    artworks: JSON.stringify(sample.artworks),
    annual_artworks: JSON.stringify(sample.annualArtworks),
  });
}

// ── 角色数据访问 ──

export function getAllCharacters(): (Character & { creatorNickname?: string })[] {
  const rows = getDb()
    .prepare(
      `SELECT c.*, u.nickname as creator_nickname
       FROM characters c LEFT JOIN users u ON c.creator_id = u.id
       ORDER BY c.created_at`
    )
    .all() as any[];
  return rows.map(rowToCharacter);
}

export function getCharacterById(id: string): (Character & { creatorNickname?: string }) | undefined {
  const row = getDb()
    .prepare(
      `SELECT c.*, u.nickname as creator_nickname
       FROM characters c LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.id = ?`
    )
    .get(id) as any;
  if (!row) return undefined;
  return rowToCharacter(row);
}

export function createCharacter(
  c: Omit<Character, "id"> & { id?: string }
): Character {
  const id = c.id || generateId(c.name);
  getDb().prepare(`
    INSERT INTO characters (id, name, age, anchor, world_description, portrait, outfits, artworks, annual_artworks, creator_id)
    VALUES (@id, @name, @age, @anchor, @world_description, @portrait, @outfits, @artworks, @annual_artworks, @creator_id)
  `).run({
    id,
    name: c.name,
    age: c.age,
    anchor: c.anchor,
    world_description: c.worldDescription,
    portrait: c.portrait || "",
    outfits: JSON.stringify(c.outfits || []),
    artworks: JSON.stringify(c.artworks || []),
    annual_artworks: JSON.stringify(c.annualArtworks || ["", "", "", "", "", ""]),
    creator_id: c.creatorId || "",
  });
  return getCharacterById(id)!;
}

export function updateCharacter(id: string, c: Partial<Character>): boolean {
  const existing = getCharacterById(id);
  if (!existing) return false;
  const merged = { ...existing, ...c };
  getDb().prepare(`
    UPDATE characters SET
      name = @name, age = @age, anchor = @anchor, world_description = @world_description,
      portrait = @portrait, outfits = @outfits, artworks = @artworks, annual_artworks = @annual_artworks
    WHERE id = @id
  `).run({
    id,
    name: merged.name,
    age: merged.age,
    anchor: merged.anchor,
    worldDescription: merged.worldDescription,
    portrait: merged.portrait || "",
    outfits: JSON.stringify(merged.outfits || []),
    artworks: JSON.stringify(merged.artworks || []),
    annual_artworks: JSON.stringify(merged.annualArtworks || ["", "", "", "", "", ""]),
  });
  return true;
}

export function deleteCharacter(id: string): boolean {
  const result = getDb().prepare("DELETE FROM characters WHERE id = ?").run(id);
  return result.changes > 0;
}

// ── 用户数据访问 ──

export interface User {
  id: string;
  username: string;
  nickname: string;
  isAdmin: boolean;
}

export function getUserByUsername(username: string) {
  const row = getDb().prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
  return row
    ? { id: row.id, username: row.username, nickname: row.nickname, passwordHash: row.password_hash, isAdmin: !!row.is_admin }
    : undefined;
}

export function getUserById(id: string) {
  const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  return row
    ? { id: row.id, username: row.username, nickname: row.nickname, passwordHash: row.password_hash, isAdmin: !!row.is_admin }
    : undefined;
}

export function createUser(username: string, nickname: string, passwordHash: string): User {
  const id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const userCount = (getDb().prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
  const isAdmin = userCount === 0 ? 1 : 0;
  getDb()
    .prepare("INSERT INTO users (id, username, nickname, password_hash, is_admin) VALUES (?, ?, ?, ?, ?)")
    .run(id, username, nickname, passwordHash, isAdmin);
  return { id, username, nickname, isAdmin: !!isAdmin };
}

// ── 会话管理 ──

const SESSION_DAYS = 30;

export function createSession(userId: string): string {
  const token = generateToken();
  const expires = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 3600;
  getDb().prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires);
  return token;
}

export function getSessionUser(token: string): User | undefined {
  const row = getDb().prepare("SELECT * FROM sessions WHERE token = ?").get(token) as any;
  if (!row) return undefined;
  if (row.expires_at < Math.floor(Date.now() / 1000)) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return undefined;
  }
  return getUserById(row.user_id);
}

export function deleteSession(token: string) {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

// ── 辅助函数 ──

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 48; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

function rowToCharacter(row: any): Character & { creatorNickname?: string } {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    anchor: row.anchor,
    worldDescription: row.world_description,
    portrait: row.portrait || "",
    outfits: JSON.parse(row.outfits || "[]") as OutfitSet[],
    artworks: JSON.parse(row.artworks || "[]") as Artwork[],
    annualArtworks: JSON.parse(row.annual_artworks || "[]") as string[],
    creatorId: row.creator_id || "",
    creatorNickname: row.creator_nickname || undefined,
  };
}

function generateId(name: string): string {
  const ts = Date.now().toString(36).slice(-4);
  // 只保留 ASCII 字母数字，避免中文 ID 导致路由编码问题
  const base = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toLowerCase() || "oc";
  return `${base}-${ts}`;
}