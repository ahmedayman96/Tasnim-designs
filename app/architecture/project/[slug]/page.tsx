import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import RoomPreview from "@/components/architecture/RoomPreview";
import RenderGallery from "@/components/architecture/RenderGallery";
import DrawingReveal from "@/components/architecture/DrawingReveal";
import ScrollWalkthrough from "@/components/architecture/ScrollWalkthrough";
import { allProjects, projectBundle } from "@/lib/architecture";

export function generateStaticParams() {
    return allProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const p = projectBundle(slug);
    if (!p) return {};
    return {
        title: `${p.project} — Tasnim Elyamani`,
        description: p.work[0]?.description ?? `${p.project} — architecture and interiors.`,
    };
}

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const project = projectBundle(slug);
    if (!project) notFound();

    // A room with both an elevation and a render of the same wall can be shown as
    // one wiped against the other.
    const paired = project.work.find(
        (w) => w.images.length === 2 && w.images.some((i) => i.includes("elevation"))
    );

    return (
        <main className="bg-midnight min-h-screen">
            <Navbar />

            {/* A project that has a motion sequence opens with it */}
            {project.motion && (
                <ScrollWalkthrough
                    dir={project.motion.dir}
                    frameCount={project.motion.count}
                    width={project.motion.width}
                    height={project.motion.height}
                    title={project.project}
                    chapters={[{ at: 0, label: "The Room" }]}
                />
            )}

            {/* Header */}
            <section className="relative px-6 md:px-12 pt-32 pb-12">
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-gold/[0.025] rounded-full blur-[170px] pointer-events-none" />

                <div className="relative max-w-6xl mx-auto">
                    <Link
                        href="/architecture"
                        className="inline-flex items-center gap-2 text-warm-gray hover:text-gold text-[0.6rem] uppercase tracking-[0.3em] transition-colors mb-10"
                    >
                        &larr; Architecture
                    </Link>

                    <div className="flex items-center gap-4 mb-7">
                        <span className="h-px w-12 bg-gold/50" />
                        <span className="text-gold/80 text-[0.6rem] uppercase tracking-[0.35em]">
                            Project
                        </span>
                    </div>

                    <h1 className="font-serif text-4xl md:text-6xl font-bold text-cream leading-[1.05] max-w-3xl">
                        {project.project}
                    </h1>

                    <p className="text-warm-gray text-[0.65rem] uppercase tracking-[0.3em] mt-7">
                        {[
                            project.location,
                            project.year,
                            project.work.length > 0 ? `${project.work.length} schemes` : null,
                            project.rooms.length > 0 ? `${project.rooms.length} walkthroughs` : null,
                        ]
                            .filter(Boolean)
                            .join("  ·  ")}
                    </p>
                </div>
            </section>

            {/* Drawing wiped against render, where both exist for the same wall */}
            {paired && (
                <section className="px-6 md:px-12 py-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="h-px w-10 bg-gold/50" />
                            <span className="text-gold/80 text-[0.6rem] uppercase tracking-[0.32em]">
                                Drawn, then Built
                            </span>
                        </div>
                        <DrawingReveal
                            drawing={paired.images.find((i) => i.includes("elevation"))!}
                            render={paired.images.find((i) => !i.includes("elevation"))!}
                            alt={paired.title}
                        />
                    </div>
                </section>
            )}

            {/* Rendered schemes */}
            {project.work.length > 0 && (
                <section className="px-6 md:px-12 py-16">
                    <div className="max-w-6xl mx-auto space-y-28 md:space-y-40">
                        {project.work.map((w, i) => (
                            <RenderGallery key={w.slug} work={w} index={i} />
                        ))}
                    </div>
                </section>
            )}

            {/* Walkthroughs of the same project, if it has been built */}
            {project.rooms.length > 0 && (
                <section className="px-6 md:px-12 py-20 border-t border-gold/10">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-4 mb-12">
                            <span className="h-px w-10 bg-gold/50" />
                            <span className="text-gold/80 text-[0.6rem] uppercase tracking-[0.32em]">
                                Walk the Finished Rooms
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-16 md:gap-y-24">
                            {project.rooms.map((room, i) => (
                                <div key={room.slug} className={i % 2 === 1 ? "sm:mt-24" : ""}>
                                    <RoomPreview
                                        slug={room.slug}
                                        title={room.title}
                                        titleAr={room.titleAr}
                                        dir={room.frames.dir}
                                        frameCount={room.frames.count}
                                        index={i}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="px-6 md:px-12 pb-28 pt-6">
                <div className="max-w-5xl mx-auto">
                    <Link
                        href="/book"
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-midnight font-bold uppercase tracking-[0.15em] text-sm px-8 py-3.5 transition-all hover:shadow-[0_0_40px_rgba(201,165,90,0.35)] hover:-translate-y-0.5"
                    >
                        Discuss a Project
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
