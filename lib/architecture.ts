import workData from "@/content/architecture.json";
import walkthroughData from "@/content/walkthroughs.json";
import comparisonData from "@/content/comparisons.json";

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
 * Work that is not filed under a project, so the service page can list it without
 * repeating what its project folders already show.
 */
export function looseWorkForService(id: ServiceId): ArchitectureWork[] {
    return workForService(id).filter((w) => !w.project);
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
/** URL-safe key for a project name, so a project can have its own page. */
export function projectSlug(project: string): string {
    return project
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function walkthroughProjects(id: ServiceId) {
    const groups = new Map<string, Walkthrough[]>();
    for (const w of walkthroughsForService(id)) {
        const key = w.project ?? "Other Work";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(w);
    }
    return [...groups.entries()].map(([project, rooms]) => ({
        project,
        slug: projectSlug(project),
        location: rooms[0].location,
        year: rooms[0].year,
        scope: rooms[0].scope,
        rooms,
    }));
}

/** Every project that has walkthroughs, across all services. */
export function allWalkthroughProjects() {
    const groups = new Map<string, Walkthrough[]>();
    for (const w of walkthroughs) {
        const key = w.project ?? "Other Work";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(w);
    }
    return [...groups.entries()].map(([project, rooms]) => ({
        project,
        slug: projectSlug(project),
        location: rooms[0].location,
        year: rooms[0].year,
        scope: rooms[0].scope,
        service: rooms[0].service,
        rooms,
    }));
}

export function projectBySlug(slug: string) {
    return allWalkthroughProjects().find((p) => p.slug === slug);
}

/**
 * Projects assembled from everything that belongs to them — rendered rooms,
 * drawings, and any walkthroughs — rather than per service. A project is the unit
 * a visitor cares about; the service is how it is filed.
 */
export interface ProjectBundle {
    project: string;
    slug: string;
    location?: string;
    year?: number;
    scope?: string;
    work: ArchitectureWork[];
    rooms: Walkthrough[];
    /** A short scroll sequence used as the project's moving header, if it has one. */
    motion?: { dir: string; count: number; width: number; height: number };
}

const MOTION: Record<string, ProjectBundle["motion"]> = {
    "madinaty-villa": {
        dir: "/architecture/madinaty-villa/motion",
        count: 40,
        width: 900,
        height: 696,
    },
};

/**
 * How the projects are presented: the order they appear in, and the one word that
 * says what kind of job each was. Without this they came out in whatever order the
 * JSON happened to be in, and a visitor could not tell a built apartment from a
 * student study at a glance.
 */
export const PROJECT_META: Record<string, { order: number; kind: string }> = {
    "apartment-in-privado-madinaty": { order: 1, kind: "Built" },
    "sherouk-villa": { order: 2, kind: "Residential" },
    "madinaty-villa": { order: 3, kind: "Residential" },
    "residential-plan-three-uae": { order: 4, kind: "Residential" },
    "residential-plan-two": { order: 5, kind: "Residential" },
    "residential-plan-one": { order: 6, kind: "Residential" },
    "venos-store": { order: 7, kind: "Commercial" },
    "revit-studies": { order: 8, kind: "Study" },
};

export function projectKind(slug: string): string | undefined {
    return PROJECT_META[slug]?.kind;
}

export function allProjects(): ProjectBundle[] {
    const keys = new Set<string>();
    for (const w of architectureWork) keys.add(w.project ?? "Other Work");
    for (const w of walkthroughs) keys.add(w.project ?? "Other Work");

    const bundles = [...keys].map((project) => {
        const work = architectureWork.filter((w) => (w.project ?? "Other Work") === project);
        const rooms = walkthroughs.filter((w) => (w.project ?? "Other Work") === project);
        const any = work[0] ?? rooms[0];
        const slug = projectSlug(project);
        return {
            project,
            slug,
            location: (any as { location?: string })?.location,
            year: (any as { year?: number })?.year,
            scope: rooms[0]?.scope,
            work,
            rooms,
            motion: MOTION[slug],
        };
    });

    // Anything without an entry in PROJECT_META sorts to the end rather than
    // disappearing, so a newly added project is visible until it is placed.
    return bundles.sort(
        (a, b) =>
            (PROJECT_META[a.slug]?.order ?? 99) - (PROJECT_META[b.slug]?.order ?? 99)
    );
}

export function projectBundle(slug: string): ProjectBundle | undefined {
    return allProjects().find((p) => p.slug === slug);
}

/** Projects that have anything filed under a given service. */
export function projectsForService(id: ServiceId): ProjectBundle[] {
    return allProjects().filter(
        (p) => p.work.some((w) => w.service === id) || p.rooms.some((r) => r.service === id)
    );
}

/** Two stages of one view, shown wiped against each other. */
export interface Comparison {
    project: string;
    title: string;
    titleAr?: string;
    before: string;
    after: string;
    note?: string;
}

export const comparisons: Comparison[] = comparisonData as Comparison[];

export function comparisonsForProject(project: string): Comparison[] {
    return comparisons.filter((c) => c.project === project);
}
