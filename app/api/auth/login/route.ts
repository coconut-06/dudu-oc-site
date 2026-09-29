import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByUsername, createSession } from "@/lib/db";

// 用户登录
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }

    const user = getUserByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    // 创建会话
    const token = createSession(user.id);
    const res = NextResponse.json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      isAdmin: user.isAdmin,
    });
    res.cookies.set("oc_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 3600,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("登录错误:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}