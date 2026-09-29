import { NextRequest, NextResponse } from "next/server";
import { getAllCharacters, createCharacter } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// 获取所有角色
export async function GET() {
  const characters = getAllCharacters();
  return NextResponse.json(characters);
}

// 新建角色（需登录）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { name, age, anchor, worldDescription, portrait, outfits, artworks } = body;

    if (!name || !age || !anchor || !worldDescription) {
      return NextResponse.json({ error: "缺少必填字段（姓名、年龄、锚点、世界观简述）" }, { status: 400 });
    }

    const character = createCharacter({
      name,
      age,
      anchor,
      worldDescription,
      portrait: portrait || "",
      outfits: outfits || [],
      artworks: artworks || [],
      creatorId: user.id,
    });

    return NextResponse.json(character, { status: 201 });
  } catch (err) {
    console.error("创建角色错误:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}