import workData from "@/content/architecture.json";
import walkthroughData from "@/content/walkthroughs.json";

/** The services she offers. The order here is the order they appear in the nav. */
export const SERVICES = [
    {
        id: "2d",
        label: "2D Modelling",
        labelAr: "الرسومات التنفيذية",
        tagline: "Drawings a contractor can build from",
        blurb:
            "Masonry and setting-out plans, lighting and wiring layouts, sections and " +
            "joinery details at 1:50 — with material and finish schedules to match.",
    },
    {
        id: "3d",
        label: "3D Modelling",
        labelAr: "النمذجة ثلاثية الأبعاد",
        tagline: "Seeing it before it is built",
        blurb:
            "Massing studies, elevation treatments and photoreal interiors, so a client " +
            "can walk the space and settle the material palette before anything is poured.",
    },
    {
        id: "finishing",
        label: "Finishing Services",
        labelAr: "التشطيبات",
        tagline: "From drawing to built",
        blurb:
            "Supervising the work on site: finishes, joinery, stone and lighting installed " +
            "to the drawings, with the detailing checked as it goes in.",
    },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export interface ArchitectureWork {
    slug: string;
    title: string;
    titleAr?: string;
    service: ServiceId;
    /** The building this belongs to, e.g. "El Shorouk Villa". */
    project?: string;
    location?: string;
    year?: number;
    description: string;
    /** First image is the cover. */
    images: string[];
}

/**
 * Work lives in content/architecture.json for the same reason the artworks do —
 * so it can be added without editing TypeScript.
 */
export const architectureWork: ArchitectureWork[] = workData as ArchitectureWork[];

export function serviceById(id: string) {
    return SERVICES.find((s) => s.id === id);
}

export function workForService(id: ServiceId): ArchitectureWork[] {
    return architectureWork.filter((w) => w.service === id);
}

/**
 * A scroll walkthrough: a finished space the viewer moves through by scrolling,
 * built from frames pre-extracted from a video of the space.
 */
export interface Walkthrough {
    slug: string;
    title: string;
    titleAr?: string;
    description: string;
    project?: string;
    location?: string;
    year?: number;
    scope?: string;
    /** Which service page lists it. */
    service: ServiceId;
    frames: {
        /** Public directory holding f0001.webp … */
        dir: string;
        count: number;
        width: number;
        height: number;
    };
    chapters: { at: number; label: string; labelAr?: string }[];
}

export const walkthroughs: Walkthrough[] = walkthroughData as Walkthrough[];

export function walkthroughBySlug(slug: string): Walkthrough | undefined {
    return walkthroughs.find((w) => w.slug === slug);
}

export function walkthroughsForService(id: ServiceId): Walkthrough[] {
    return walkthroughs.filter((w) => w.service === id);
}

/**
 * Walkthroughs grouped by the building they belong to, in catalogue order.
 * The service pages present a project and its rooms, rather than a flat list of
 * rooms detached from the job they came from.
 */
export function walkthroughProjects(id: ServiceId) {
    const groups = new Map<string, Walkthrough[]>();
    for (const w of walkthroughsForService(id)) {
        const key = w.project ?? "Other Work";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(w);
    }
    return [...groups.entries()].map(([project, rooms]) => ({
        project,
        location: rooms[0].location,
        year: rooms[0].year,
        scope: rooms[0].scope,
        rooms,
    }));
}
