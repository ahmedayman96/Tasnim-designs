import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { SERVICES, allProjects, projectKind } from "@/lib/architecture";

export const metadata: Metadata = {
    title: "Architecture & Interiors — Tasnim Elyamani",
    description:
        "Architecture and interior design by Tasnim Elyamani — apartments, private villas, retail and public interiors, from drawings through 3D to finished rooms.",
};

/**
 * The index of her architecture work.
 *
 * This page used to open with a scroll cinematic of a single villa and a fact
 * sheet about it, and never listed the projects at all — you had to guess which
 * service page a job was filed under to find it. It is now a plain index: every
 * project, in a deliberate order, each labelled with what kind of job it was and
 * what it contains. The services are what she does, so they sit underneath as a
 * way of working rather than as the way in.
 */
export default function ArchitecturePage() {
    const projects = allProjects();

    return (
        <main className="bg-midnight min-h-screen">
            <Navbar />

            {/* Header */}
            <section className="relative px-6 md:px-12 pt-36 pb-14">
                <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[760px] h-[380px] bg-gold/[0.03] rounded-full blur-[170px] pointer-events-none" />

                <div className="relative max-w-5xl mx-auto text-center">
                    <p className="text-gold text-xs uppercase tracking-[0.32em] mb-5 font-medium">
                        Architecture &amp; Interiors
                    </p>
                    <h1 className="font-serif text-4xl md:text-6xl font-bold text-cream leading-[1.05]">
                        The Work
                    </h1>
                    <p className="font-arabic text-gold/60 text-2xl mt-4" dir="rtl">
                        الأعمال
                    </p>
                    <p className="text-cream-muted/90 text-lg font-light leading-relaxed mt-8 max-w-2xl mx-auto">
                        Apartments, private villas, retail and public interiors — drawn in
                        AutoCAD and Revit, modelled and rendered in 3ds Max, and followed
                        through to the finished room.
                    </p>
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-10" />
                </div>
            </section>

            {/* Every project, in order */}
            <section className="px-6 md:px-12 pb-24">
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                    {projects.map((p) => {
                        const cover = p.rooms[0]
                            ? `${p.rooms[0].frames.dir}/f0001.webp`
                            : p.work[0]?.images[0];
                        if (!cover) return null;

                        const contents = [
                            p.work.length
                                ? `${p.work.length} scheme${p.work.length === 1 ? "" : "s"}`
                                : null,
                            p.rooms.length
                                ? `${p.rooms.length} walkthrough${p.rooms.length === 1 ? "" : "s"}`
                                : null,
                        ]
                            .filter(Boolean)
                            .join(" · ");

                        return (
                            <Link
                                key={p.slug}
                                href={`/architecture/project/${p.slug}`}
                                className="group block rounded-lg overflow-hidden border border-gold/10 hover:border-gold/35 bg-charcoal/30 transition-colors duration-500"
                            >
                                <div className="relative aspect-[4/3] bg-charcoal overflow-hidden">
                                    <Image
                                        src={cover}
                                        alt={p.project}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/15 to-transparent" />

                                    {projectKind(p.slug) && (
                                        <span className="absolute top-4 left-4 rounded-full bg-midnight/75 backdrop-blur-sm border border-gold/25 text-gold/90 text-[0.55rem] uppercase tracking-[0.25em] px-3 py-1.5">
                                            {projectKind(p.slug)}
                                        </span>
                                    )}
                                </div>

                                <div className="p-6">
                                    <h2 className="font-serif text-xl md:text-2xl text-cream group-hover:text-gold transition-colors duration-500 leading-snug">
                                        {p.project}
                                    </h2>
                                    <p className="text-warm-gray text-[0.58rem] uppercase tracking-[0.25em] mt-3">
                                        {[p.location, p.year].filter(Boolean).join("  ·  ")}
                                    </p>
                                    <p className="text-cream-muted/70 text-xs font-light mt-3">
                                        {contents}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* How she works — the three services, after the work rather than instead of it */}
            <section className="relative z-10 bg-charcoal/40 border-t border-gold/10">
                <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28">
                    <div className="flex items-center gap-4 mb-12">
                        <span className="h-px w-10 bg-gold/60" />
                        <span className="text-gold/90 text-xs uppercase tracking-[0.32em]">
                            What She Does
                        </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 md:gap-10">
                        {SERVICES.map((s) => (
                            <Link
                                key={s.id}
                                href={`/architecture/${s.id}`}
                                className="group block rounded-xl border border-gold/10 hover:border-gold/30 bg-midnight/40 p-8 transition-colors"
                            >
                                <h3 className="font-serif text-2xl text-cream font-bold group-hover:text-gold transition-colors">
                                    {s.label}
                                </h3>
                                <p className="font-arabic text-gold/50 text-lg mt-2" dir="rtl">
                                    {s.labelAr}
                                </p>
                                <p className="text-cream-muted/80 text-sm font-light leading-relaxed mt-5">
                                    {s.blurb}
                                </p>
                                <span className="inline-block text-gold/70 text-[0.65rem] uppercase tracking-[0.25em] mt-6 group-hover:text-gold transition-colors">
                                    See the work &rarr;
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
