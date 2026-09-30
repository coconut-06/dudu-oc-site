import Link from "next/link";
import { getAllCharacters } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizeAnnualArtworks } from "@/lib/characters";
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
    annualArtworks: normalizeAnnualArtworks(c.annualArtworks),
    creatorId: c.creatorId,
  }));

  return (
    <main className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
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
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl">
          DUDU
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-gray-400">
          这里收录着我的 OC 角色，点击卡片查看他们的立绘、服设与稿件。
        </p>
      </section>

      {/* 左右对称分区：左侧角色模块 / 右侧年度稿件模块 */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── 左侧：角色模块（新建角色 + 角色卡片展示） ── */}
          <div className="lg:col-span-1">
            {characters.length === 0 ? (
              /* 空状态：整个区域居中显示新建角色按钮 */
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                <p className="text-sm text-gray-400">
                  {user ? "还没有角色，点击下方按钮创建第一个 OC 吧" : (
                    <span>还没有角色，<Link href="/register" className="text-pink-300 hover:underline">注册</Link>后开始创建吧</span>
                  )}
                </p>
                {user ? (
                  <HomeActions user={{ id: user.id, username: user.username, nickname: user.nickname, isAdmin: user.isAdmin }} />
                ) : null}
              </div>
            ) : (
              <>
                {/* 角色区头部：标题 + 新建角色按钮（按钮紧贴标题右侧） */}
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="text-sm font-semibold tracking-widest text-gray-400">角 色 区</h2>
                  {user && (
                    <HomeActions user={{ id: user.id, username: user.username, nickname: user.nickname, isAdmin: user.isAdmin }} />
                  )}
                </div>

                {/* 角色卡片列表：居中展示在左侧区域中心，每张稍大 */}
                <div className="flex flex-col items-center gap-6">
                  {characters.map((c) => (
                    <Link
                      key={c.id}
                      href={`/character/${c.id}`}
                      className="group relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-50"
                    >
                      {/* 立绘区域 — 完整展示（稍大） */}
                      <div className="relative mb-5 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 via-pink-50/40 to-rose-50/40">
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

                      <h3 className="text-lg font-semibold text-gray-800">{c.name}</h3>
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
              </>
            )}
          </div>

          {/* ── 右侧：年度稿件模块（独立，一个角色对应一组年度稿件） ── */}
          <div className="lg:col-span-1">
            <HomeAnnualModule characters={annualData} user={user ? { id: user.id, isAdmin: user.isAdmin } : null} />
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        DUDU · OC 小站
      </footer>
    </main>
  );
}
