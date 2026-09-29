import { cookies } from "next/headers";
import { getSessionUser, type User } from "@/lib/db";

// 从请求 Cookie 中获取当前登录用户
export async function getCurrentUser(): Promise<User | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get("oc_session")?.value;
  if (!token) return undefined;
  return getSessionUser(token);
}

export const SESSION_COOKIE = "oc_session";