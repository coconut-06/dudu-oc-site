import Link from "next/link";
import { getAllCharacters } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import HomeActions from "@/app/components/HomeActions";
import HomeAnnualModule from "@/app/components/HomeAnnualModule";

export default async function Home() {
  const characters = getAllCharacters();
  const user = await getCurrentUser();

  // 为年度稿件模块准备精简数据
  const annualData = characters.map((c) => ({
    id: c.id,
    name: c.name,
    portrait: c.portrait,
    annualArtworks: c.annualArtworks || ["", "", "", "", "", ""],
    creatorId: c.creatorId,
  }));

  return (
    <main className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">DUDU</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="rounded-full bg-pink-50 px-3 py-1 text-pink-300">角色图鉴</span>
            {user ? (
              <>
                <Link href="/admin" className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50">
                  管理
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs text-gray-500 transition-colors hover:text-pink-300">登录</Link>
                <Link href="/register" className="rounded-full bg-pink-200 px-3 py-1 text-xs font-medium text-pink-600 transition-colors hover:bg-pink-300">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 主视觉 */}
      <section className="mx-auto max-w-5xl px-4 pb-8 pt-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl">
          DUDU
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-gray-400">
          这里收录着我的 OC 角色，点击卡片查看他们的立绘、服设与稿件。
        </p>
      </section>

      {/* 新建角色 + 年度稿件 并排区域 */}
      {user && characters.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {/* 左侧：新建角色按钮 */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <HomeActions user={{ id: user.id, username: user.username, nickname: user.nickname, isAdmin: user.isAdmin }} />
            </div>
            {/* 右侧：年度稿件展示模块 */}
            <HomeAnnualModule characters={annualData} user={{ id: user.id, isAdmin: user.isAdmin }} />
          </div>
        </section>
      )}

      {/* 角色卡片列表 */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        {characters.length === 0 ? (
          <p className="text-center text-gray-400">
            {user ? "还没有角色，点击「新建角色」开始创建吧" : (
              <span>还没有角色，<Link href="/register" className="text-pink-300 hover:underline">注册</Link>后开始创建吧</span>
            )}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((c) => (
              <Link
                key={c.id}
                href={`/character/${c.id}`}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-50"
              >
                {/* 立绘区域 — 完整展示 */}
                <div className="relative mb-5 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 via-pink-50/50 to-rose-50/50">
                  {c.portrait ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={c.portrait} alt={c.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <span className="text-7xl font-black text-gray-200 transition-transform group-hover:scale-110">
                      {c.name.charAt(0)}
                    </span>
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-xs text-gray-500">
                    {c.age}岁
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-gray-800">{c.name}</h2>
                <p className="mt-0.5 text-sm text-pink-300">{c.anchor}</p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-400">{c.worldDescription}</p>

                {/* 稿件预览 */}
                {c.artworks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.artworks.slice(0, 4).map((a, i) => (
                      <div key={i} className="relative aspect-[4/3] w-14 overflow-hidden rounded-md border border-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.url} alt="" className="h-full w-full object-cover" />
                        {i === 3 && c.artworks.length > 4 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
                            +{c.artworks.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-3 text-xs text-gray-300">
                  <span>服设 {c.outfits.length} 套</span>
                  <span>稿件 {c.artworks.length} 张</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 页脚 */}
      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        DUDU · OC 小站
      </footer>
    </main>
  );
}
