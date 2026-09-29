import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/db";

// 退出登录
export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("oc_session")?.value;
  if (token) {
    deleteSession(token);
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set("oc_session", "", { maxAge: 0, path: "/" });
  return res;
}