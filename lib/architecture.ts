import workData from "@/content/architecture.json";

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
