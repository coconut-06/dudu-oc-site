import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByUsername, createUser, createSession } from "@/lib/db";

// 用户注册
export async function POST(request: NextRequest) {
  try {
    const { username, nickname, password } = await request.json();

    // 参数校验
    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ error: "用户名需为 3-20 位字母、数字或下划线" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    // 检查用户名是否已存在
    if (getUserByUsername(username)) {
      return NextResponse.json({ error: "用户名已被占用" }, { status: 400 });
    }

    // 创建用户（第一个注册的用户自动成为管理员）
    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser(username, nickname || username, passwordHash);

    // 自动登录：创建会话
    const token = createSession(user.id);
    const res = NextResponse.json(
      { id: user.id, username: user.username, nickname: user.nickname, isAdmin: user.isAdmin },
      { status: 201 }
    );
    res.cookies.set("oc_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 3600,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("创建角色错误:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}