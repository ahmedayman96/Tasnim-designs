import path from "node:path";
import { promises as fs } from "node:fs";

const CATALOGUE = path.join(process.cwd(), "content", "artworks.json");

export async function readCatalogue() {
    return JSON.parse(await fs.readFile(CATALOGUE, "utf8"));
}

export async function writeCatalogue(artworks) {
    // Trailing newline keeps the diff clean when the file is committed.
    await fs.writeFile(CATALOGUE, `${JSON.stringify(artworks, null, 2)}\n`, "utf8");
}

/**
 * Slugs are the public URL and the key checkout resolves prices against, so they
 * have to be stable, ASCII and unique. Arabic titles transliterate to nothing
 * useful, hence the fallback.
 */
export function slugify(title) {
    const base = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return base || `artwork-${Date.now()}`;
}

export function uniqueSlug(desired, artworks) {
    if (!artworks.some((a) => a.slug === desired)) return desired;
    let n = 2;
    while (artworks.some((a) => a.slug === `${desired}-${n}`)) n += 1;
    return `${desired}-${n}`;
}

/** Fields the site will break without. Checked before anything is written. */
export function validateArtwork(artwork) {
    const problems = [];

    // A piece can go up as a draft: no price yet (shown as "price on request",
    // and refused by checkout), no Arabic title, no story until she writes one.
    // These are the fields the page genuinely cannot render without.
    const required = ["slug", "title", "medium", "year", "image", "description"];

    for (const field of required) {
        const value = artwork[field];
        if (value === undefined || value === null || value === "") {
            problems.push(`missing ${field}`);
        }
    }

    // null is a deliberate "not for sale yet". Any other non-positive value is a bug.
    if (artwork.price !== null && artwork.price !== undefined) {
        if (
            typeof artwork.price !== "number" ||
            !Number.isFinite(artwork.price) ||
            artwork.price <= 0
        ) {
            problems.push("price must be a positive number, or null for on-request");
        }
    }
    if (typeof artwork.year !== "number" || artwork.year < 1900 || artwork.year > 2100) {
        problems.push("year looks wrong");
    }
    for (const key of ["bg", "accent", "textColor"]) {
        if (!/^#[0-9a-f]{6}$/i.test(artwork.theme?.[key] ?? "")) {
            problems.push(`theme.${key} is not a hex colour`);
        }
    }

    return problems;
}
