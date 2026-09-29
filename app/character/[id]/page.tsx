import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacterById } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ArtworkGrid from "@/app/components/ArtworkGrid";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const c = getCharacterById(id);
  if (!c) return { title: "角色不存在" };
  return { title: `${c.name} · DUDU`, description: c.worldDescription };
}

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;
  const c = getCharacterById(id);
  if (!c) notFound();

  const user = await getCurrentUser();
  const canEdit = user ? (user.isAdmin || c.creatorId === user.id) : false;

  const infos = [
    { label: "年龄", value: c.age },
    { label: "锚点", value: c.anchor },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* 导航 */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">DUDU</span>
          </Link>
          <Link href="/" className="rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">← 返回</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* 立绘 + 基本信息 */}
        <div className="flex flex-col gap-8 sm:flex-row">
          <div className="relative flex h-72 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 via-pink-50/50 to-rose-50/50 sm:w-64">
            {c.portrait ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={c.portrait} alt={c.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-7xl font-black text-gray-200">{c.name.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">{c.name}</h1>
            <div className="mt-3 flex gap-3">
              {infos.map((info) => (
                <span key={info.label} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                  {info.label}：{info.value}
                </span>
              ))}
            </div>
            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold text-gray-500">世界观简述</h2>
              <p className="leading-relaxed text-gray-600">{c.worldDescription}</p>
            </div>
            {c.creatorNickname && (
              <p className="mt-4 text-xs text-gray-400">创建者：{c.creatorNickname}</p>
            )}
          </div>
        </div>

        {/* 服设展示 + 稿件展示 */}
        <div className="mt-12">
            {/* 服设展示 */}
            {c.outfits.length > 0 && (
              <div className="mb-12">
                <h2 className="mb-5 text-sm font-semibold tracking-widest text-gray-400">服 设 展 示</h2>
                <div className="space-y-6">
                  {c.outfits.map((outfit) => (
                    <div key={outfit.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                      <h3 className="mb-3 text-sm font-medium text-gray-700">{outfit.name}</h3>
                      {outfit.images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {outfit.images.map((img, i) => (
                            <div key={i} className="aspect-square overflow-hidden rounded-lg bg-gray-50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img} alt={`${outfit.name} ${i + 1}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300">暂无图片</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 稿件展示 + 九宫格导出 */}
            {c.artworks.length > 0 && (
              <div>
                <h2 className="mb-5 text-sm font-semibold tracking-widest text-gray-400">稿 件 展 示</h2>
                <ArtworkGrid artworks={c.artworks.map((a) => ({ url: a.url }))} characterName={c.name} />
              </div>
            )}
        </div>

        {/* 返回 */}
        <div className="mt-10 text-center">
          <Link href="/" className="inline-block rounded-full bg-pink-200 px-8 py-3 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-300">
            ← 回到首页
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        DUDU · OC 小站
      </footer>
    </main>
  );
}
