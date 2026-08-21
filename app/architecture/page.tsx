import type { Metadata } from "next";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ProjectSequence from "@/components/architecture/ProjectSequence";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
    title: "Architecture & Interiors — Tasnim Elyamani",
    description:
        "Residential architecture and interior design by Tasnim Elyamani — private villas, full interior packages, and construction documentation.",
};

export default function ArchitecturePage() {
    const project = projects[0];

    // Fields still to be confirmed are held back rather than shown as blanks.
    const facts = [
        { k: "Type", v: project.type },
        { k: "Location", v: project.location },
        { k: "Year", v: String(project.year) },
        { k: "Area", v: project.area },
        { k: "Status", v: project.status },
    ].filter((f) => f.v && f.v !== "TBC");

    return (
        <main className="bg-midnight min-h-screen">
            <Navbar />

            <ProjectSequence project={project} />

            {/* Fact sheet — laid out like the title block on a drawing */}
            <section className="relative z-10 bg-midnight border-t border-gold/10">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
                    <div className="grid md:grid-cols-12 gap-12 md:gap-16">
                        <div className="md:col-span-5">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="h-px w-10 bg-gold/60" />
                                <span className="text-gold/90 text-xs uppercase tracking-[0.32em]">
                                    The Project
                                </span>
                            </div>
                            <h2 className="font-serif text-4xl md:text-5xl font-bold text-cream leading-tight">
                                {project.title}
                            </h2>
                            <p
                                className="font-arabic text-gold/60 text-2xl mt-4"
                                dir="rtl"
                            >
                                {project.titleAr}
                            </p>
                        </div>

                        <div className="md:col-span-7">
                            <p className="text-cream-muted text-lg md:text-xl font-light leading-relaxed">
                                {project.summary}
                            </p>

                            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-8 mt-14 pt-10 border-t border-gold/10">
                                {facts.map((f) => (
                                    <div key={f.k}>
                                        <dt className="text-warm-gray text-[0.6rem] uppercase tracking-[0.3em] mb-2">
                                            {f.k}
                                        </dt>
                                        <dd className="text-cream text-sm font-light">
                                            {f.v}
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            {project.credit && (
                                <p className="text-warm-gray/70 text-xs font-light mt-12 leading-relaxed">
                                    {project.credit}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Services */}
            <section className="relative z-10 bg-charcoal/40 border-t border-gold/10">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
                    <div className="flex items-center gap-4 mb-14">
                        <span className="h-px w-10 bg-gold/60" />
                        <span className="text-gold/90 text-xs uppercase tracking-[0.32em]">
                            Practice
                        </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 md:gap-16">
                        {[
                            {
                                t: "Architecture",
                                ta: "العمارة",
                                d: "Concept through to elevation studies — massing, façade composition, and the material logic that holds them together.",
                            },
                            {
                                t: "Interiors",
                                ta: "التصميم الداخلي",
                                d: "Full interior packages: joinery detailing, material and finish schedules, lighting layouts, and furniture selection.",
                            },
                            {
                                t: "Documentation",
                                ta: "الرسومات التنفيذية",
                                d: "Construction drawings a contractor can build from — masonry and setting-out plans, wiring and lighting, sections and details at 1:50.",
                            },
                        ].map((s) => (
                            <div key={s.t}>
                                <h3 className="font-serif text-2xl md:text-3xl text-cream font-bold">
                                    {s.t}
                                </h3>
                                <p
                                    className="font-arabic text-gold/50 text-lg mt-2"
                                    dir="rtl"
                                >
                                    {s.ta}
                                </p>
                                <p className="text-cream-muted/80 text-sm font-light leading-relaxed mt-5">
                                    {s.d}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
