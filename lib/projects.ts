export interface Chapter {
    /** Overline label, e.g. "01 / GARDEN SIDE" — set in the margin like a drawing sheet */
    label: string;
    labelAr?: string;
    title: string;
    caption: string;
    image: string;
    /** Time of day this frame was rendered at — drives the ambient tint of the chapter */
    hour: "day" | "afternoon" | "dusk" | "night";
    /** Camera push: [startScale, endScale] across the chapter's scroll range */
    push: [number, number];
    /** Focal origin for the push, as a CSS transform-origin */
    origin: string;
}

export interface Project {
    slug: string;
    title: string;
    titleAr: string;
    type: string;
    location: string;
    year: number;
    area: string;
    status: string;
    /** Shown under the project title on the index card */
    summary: string;
    /** The credit line — see note in ARCHITECTURE.md about OFFSET Design workshop */
    credit?: string;
    cover: string;
    chapters: Chapter[];
}

export const projects: Project[] = [
    {
        slug: "rotunda-villa",
        title: "Rotunda Villa",
        titleAr: "فيلا الروتوندا",
        type: "Private Residence",
        location: "TBC",
        year: 2026,
        area: "TBC",
        status: "Under construction",
        summary:
            "A private villa organised around a domed rotunda — travertine and black marble, brass reveals, and a double-height hall lit from above.",
        cover: "/images/architecture/04-threshold.webp",
        chapters: [
            {
                label: "01 / Garden Side",
                labelAr: "جهة الحديقة",
                title: "Rotunda Villa",
                caption:
                    "The villa reads quietly from the garden — a flat travertine mass, opened where the rotunda pushes forward and lifts into its dome.",
                image: "/images/architecture/01-garden.webp",
                hour: "day",
                push: [1.0, 1.14],
                origin: "50% 55%",
            },
            {
                label: "02 / Court",
                labelAr: "الفناء",
                title: "Water & Light",
                caption:
                    "On the court elevation the composition turns symmetrical. A sheet of water falls against black marble; behind the full-height glazing, the stair chandelier hangs three storeys.",
                image: "/images/architecture/02-court.webp",
                hour: "afternoon",
                push: [1.06, 1.2],
                origin: "50% 45%",
            },
            {
                label: "03 / Approach",
                labelAr: "المدخل",
                title: "The Ascent",
                caption:
                    "Steps rise in lit bands toward the entrance. At dusk the recessed strips come up before the sky has gone, and the stone reads warm against a cooling sky.",
                image: "/images/architecture/03-approach.webp",
                hour: "dusk",
                push: [1.04, 1.18],
                origin: "42% 60%",
            },
            {
                label: "04 / Threshold",
                labelAr: "العتبة",
                title: "After Dark",
                caption:
                    "Night resolves the façade into three arches and a band of black marble. The dome sits above, unlit — the one part of the house that stays dark.",
                image: "/images/architecture/04-threshold.webp",
                hour: "night",
                push: [1.02, 1.16],
                origin: "50% 50%",
            },
        ],
    },
];

export function getProjectBySlug(slug: string): Project | undefined {
    return projects.find((p) => p.slug === slug);
}
