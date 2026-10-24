import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";

import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import {
    SERVICES,
    serviceById,
    workForService,
    walkthroughProjects,
    type ServiceId,
} from "@/lib/architecture";

export function generateStaticParams() {
    return SERVICES.map((s) => ({ service: s.id }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ service: string }>;
}): Promise<Metadata> {
    const { service: id } = await params;
    const service = serviceById(id);
    if (!service) return {};
    return {
        title: `${service.label} — Tasnim Elyamani`,
        description: service.blurb,
    };
}

export default async function ServicePage({
    params,
}: {
    params: Promise<{ service: string }>;
}) {
    const { service: id } = await params;
    const service = serviceById(id);
    if (!service) notFound();

    const work = workForService(service.id as ServiceId);
    const projects = walkthroughProjects(service.id as ServiceId);

    return (
        <main className="bg-midnight min-h-screen">
            <Navbar />

            {/* Service header */}
            <section className="relative px-6 md:px-12 pt-36 pb-16">
                <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gold/[0.03] rounded-full blur-[160px] pointer-events-none" />

                <div className="relative max-w-4xl mx-auto text-center">
                    <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4 font-medium">
                        Architecture · {service.tagline}
                    </p>
                    <h1 className="font-serif text-4xl md:text-6xl font-bold text-cream">
                        {service.label}
                    </h1>
                    <p className="font-arabic text-gold/60 text-2xl mt-4" dir="rtl">
                        {service.labelAr}
                    </p>
                    <p className="text-cream-muted/90 text-lg font-light leading-relaxed mt-8 max-w-2xl mx-auto">
                        {service.blurb}
                    </p>
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-10" />
                </div>
            </section>

            {/* Sibling services, so the three read as one offer rather than three pages */}
            <section className="px-6 md:px-12 pb-4">
                <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3">
                    {SERVICES.map((s) => (
                        <Link
                            key={s.id}
                            href={`/architecture/${s.id}`}
                            className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.2em] transition-all ${s.id === service.id
                                ? "bg-gold/15 border border-gold/40 text-gold"
                                : "border border-gold/10 text-cream-muted hover:text-gold hover:border-gold/30"
                                }`}
                        >
                            {s.label}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Projects — one folder each, opened to reveal its rooms */}
            {projects.length > 0 && (
                <section className="px-6 md:px-12 pt-10 pb-4">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        {projects.map((p) => (
                            <Link
                                key={p.slug}
                                href={`/architecture/project/${p.slug}`}
                                className="group relative block"
                            >
                                {/* Stacked edges behind the cover, so a project reads as a
                                    folder holding several rooms rather than a single image. */}
                                <span className="absolute -top-2 left-4 right-4 h-6 rounded-t-lg bg-charcoal/70 border-t border-x border-gold/10 group-hover:border-gold/25 transition-colors duration-500" />
                                <span className="absolute -top-1 left-2 right-2 h-6 rounded-t-lg bg-charcoal/85 border-t border-x border-gold/10 group-hover:border-gold/30 transition-colors duration-500" />

                                <div className="relative overflow-hidden rounded-lg border border-gold/10 group-hover:border-gold/40 transition-colors duration-500">
                                    <div className="relative aspect-[16/11] bg-charcoal overflow-hidden">
                                        <Image
                                            src={`${p.rooms[0].frames.dir}/f0001.webp`}
                                            alt={p.project}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 p-7">
                                        <p className="text-gold/80 text-[0.58rem] uppercase tracking-[0.3em] mb-2.5">
                                            {p.rooms.length} Rooms · Scroll Walkthroughs
                                        </p>
                                        <h2 className="font-serif text-2xl md:text-3xl text-cream group-hover:text-gold transition-colors duration-500">
                                            {p.project}
                                        </h2>
                                        <p className="text-warm-gray text-[0.6rem] uppercase tracking-[0.25em] mt-2.5">
                                            {[p.location, p.year].filter(Boolean).join("  ·  ")}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Work */}
            <section className="px-6 md:px-12 py-20">
                <div className="max-w-7xl mx-auto">
                    {work.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {work.map((item) => (
                                <article
                                    key={item.slug}
                                    className="group rounded-xl overflow-hidden border border-gold/10 bg-charcoal/40 hover:border-gold/30 transition-colors"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-charcoal">
                                        {item.images[0] && (
                                            <Image
                                                src={item.images[0]}
                                                alt={item.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent" />
                                    </div>

                                    <div className="p-6">
                                        <h2 className="font-serif text-xl text-cream group-hover:text-gold transition-colors">
                                            {item.title}
                                        </h2>
                                        {(item.project || item.year) && (
                                            <p className="text-warm-gray text-[0.65rem] uppercase tracking-[0.25em] mt-2">
                                                {[item.project, item.location, item.year]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </p>
                                        )}
                                        <p className="text-cream-muted/80 text-sm font-light leading-relaxed mt-4">
                                            {item.description}
                                        </p>
                                        {item.images.length > 1 && (
                                            <p className="text-gold/50 text-xs mt-4 tracking-wider">
                                                {item.images.length} drawings
                                            </p>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : projects.length > 0 ? null : (
                        /* Nothing published for this service yet. Say so plainly rather
                           than showing an empty grid, and keep a way forward. */
                        <div className="max-w-xl mx-auto text-center py-16">
                            <p className="text-cream-muted font-light leading-relaxed">
                                Work from this service is being prepared for the site.
                            </p>
                            <p className="text-warm-gray text-sm font-light mt-4">
                                If you would like to see examples in the meantime, ask and
                                she will send them directly.
                            </p>
                            <Link
                                href="/book"
                                className="inline-flex items-center justify-center mt-10 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-midnight font-bold uppercase tracking-[0.15em] text-sm px-8 py-3.5 transition-all hover:shadow-[0_0_40px_rgba(201,165,90,0.35)] hover:-translate-y-0.5"
                            >
                                Get in Touch
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
