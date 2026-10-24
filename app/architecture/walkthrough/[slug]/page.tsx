import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ScrollWalkthrough from "@/components/architecture/ScrollWalkthrough";
import { walkthroughs, walkthroughBySlug } from "@/lib/architecture";

export function generateStaticParams() {
    return walkthroughs.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const w = walkthroughBySlug(slug);
    if (!w) return {};
    return {
        title: `${w.title} — Walkthrough — Tasnim Elyamani`,
        description: w.description,
    };
}

export default async function WalkthroughPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const w = walkthroughBySlug(slug);
    if (!w) notFound();

    return (
        <main className="bg-midnight min-h-screen">
            <Navbar />

            <ScrollWalkthrough
                dir={w.frames.dir}
                frameCount={w.frames.count}
                width={w.frames.width}
                height={w.frames.height}
                chapters={w.chapters}
                title={w.title}
                titleAr={w.titleAr}
            />

            {/* Detail, read after the walk */}
            <section className="relative z-10 bg-midnight border-t border-gold/10">
                <div className="max-w-5xl mx-auto px-6 md:px-12 py-24 md:py-32">
                    <div className="grid md:grid-cols-12 gap-12">
                        <div className="md:col-span-5">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="h-px w-10 bg-gold/60" />
                                <span className="text-gold/90 text-xs uppercase tracking-[0.32em]">
                                    The Space
                                </span>
                            </div>
                            <h1 className="font-serif text-3xl md:text-4xl font-bold text-cream leading-tight">
                                {w.title}
                            </h1>
                            {w.titleAr && (
                                <p className="font-arabic text-gold/60 text-2xl mt-3" dir="rtl">
                                    {w.titleAr}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-7">
                            <p className="text-cream-muted text-lg font-light leading-relaxed">
                                {w.description}
                            </p>

                            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-8 mt-12 pt-10 border-t border-gold/10">
                                {[
                                    { k: "Project", v: w.project },
                                    { k: "Location", v: w.location },
                                    { k: "Year", v: w.year ? String(w.year) : undefined },
                                    { k: "Scope", v: w.scope },
                                ]
                                    .filter((f) => f.v)
                                    .map((f) => (
                                        <div key={f.k}>
                                            <dt className="text-warm-gray text-[0.6rem] uppercase tracking-[0.3em] mb-2">
                                                {f.k}
                                            </dt>
                                            <dd className="text-cream text-sm font-light">{f.v}</dd>
                                        </div>
                                    ))}
                            </dl>

                            <div className="flex flex-wrap gap-4 mt-14">
                                <Link
                                    href="/book"
                                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-midnight font-bold uppercase tracking-[0.15em] text-sm px-8 py-3.5 transition-all hover:shadow-[0_0_40px_rgba(201,165,90,0.35)] hover:-translate-y-0.5"
                                >
                                    Discuss a Project
                                </Link>
                                <Link
                                    href="/architecture/finishing"
                                    className="inline-flex items-center text-cream-muted hover:text-gold text-sm uppercase tracking-[0.2em] transition-colors px-4 py-3"
                                >
                                    All Finishing Work
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
