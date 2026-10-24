import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import RoomPreview from "@/components/architecture/RoomPreview";
import { allWalkthroughProjects, projectBySlug, serviceById } from "@/lib/architecture";

export function generateStaticParams() {
    return allWalkthroughProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const p = projectBySlug(slug);
    if (!p) return {};
    return {
        title: `${p.project} — Tasnim Elyamani`,
        description: `${p.rooms.length} rooms walked end to end — ${p.project}.`,
    };
}

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const project = projectBySlug(slug);
    if (!project) notFound();

    const service = serviceById(project.service);

    return (
        <main className="bg-midnight min-h-screen">
            <Navbar />

            {/* Project header */}
            <section className="relative px-6 md:px-12 pt-36 pb-10">
                <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/[0.025] rounded-full blur-[170px] pointer-events-none" />

                <div className="relative max-w-5xl mx-auto">
                    {service && (
                        <Link
                            href={`/architecture/${service.id}`}
                            className="inline-flex items-center gap-2 text-warm-gray hover:text-gold text-[0.6rem] uppercase tracking-[0.3em] transition-colors mb-10"
                        >
                            &larr; {service.label}
                        </Link>
                    )}

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
                        {[project.location, project.year, project.scope]
                            .filter(Boolean)
                            .join("  ·  ")}
                    </p>

                    <p className="text-cream-muted/80 text-lg font-light leading-relaxed mt-9 max-w-xl">
                        {project.rooms.length} rooms, each walked end to end. Open any one and
                        the camera moves at the pace you scroll.
                    </p>
                </div>
            </section>

            {/* The rooms — previews that move as they pass through the viewport */}
            <section className="px-6 md:px-12 pb-28">
                <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-16 md:gap-y-24">
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
            </section>

            <Footer />
        </main>
    );
}
