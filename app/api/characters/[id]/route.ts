import { NextRequest, NextResponse } from "next/server";
import { getCharacterById, updateCharacter, deleteCharacter } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// 获取单个角色
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const character = getCharacterById(id);
  if (!character) {
    return NextResponse.json({ error: "角色不存在" }, { status: 404 });
  }
  return NextResponse.json(character);
}

// 权限检查：登录用户只能操作自己的角色，管理员可以操作全部
async function checkPermission(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "请先登录", status: 401 as const };
  const character = getCharacterById(id);
  if (!character) return { error: "角色不存在", status: 404 as const };
  if (!user.isAdmin && character.creatorId !== user.id) {
    return { error: "没有权限操作别人的角色", status: 403 as const };
  }
  return { user, character };
}

// 更新角色
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const permission = await checkPermission(id);
  if ("error" in permission) {
    return NextResponse.json({ error: permission.error }, { status: permission.status });
  }

  const body = await request.json();
  const success = updateCharacter(id, body);
  if (!success) {
    return NextResponse.json({ error: "角色不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

// 删除角色
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const permission = await checkPermission(id);
  if ("error" in permission) {
    return NextResponse.json({ error: permission.error }, { status: permission.status });
  }

  const success = deleteCharacter(id);
  if (!success) {
    return NextResponse.json({ error: "角色不存在" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}