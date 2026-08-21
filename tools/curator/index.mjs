import path from "node:path";
import { promises as fs } from "node:fs";
import {
    readCatalogue,
    writeCatalogue,
    slugify,
    uniqueSlug,
    validateArtwork,
} from "./catalogue.mjs";
import { themeFromImage, writeArtworkImage, gridSpanFor } from "./media.mjs";
import { generateCopy, copyConfigured } from "./copy.mjs";
import * as repo from "./repo.mjs";

const CATALOGUE_PATH = "content/artworks.json";

/**
 * Add a piece to the gallery.
 *
 * Everything except the English copy is derived deterministically: the slug from
 * the title, the palette and tile size from the image itself, the filename from
 * the slug. The model is asked for two sentences of prose and nothing else.
 *
 * @param {object}  input
 * @param {Buffer}  input.imageBuffer
 * @param {string}  input.title
 * @param {string}  input.titleAr   written by the artist, never generated
 * @param {number}  input.price
 * @param {string} [input.medium]
 * @param {string} [input.size]
 * @param {number} [input.year]
 * @param {string} [input.description] supply to skip the model
 * @param {string} [input.story]
 * @param {object} [options]
 * @param {boolean} [options.commit=true]
 * @param {boolean} [options.push=false]
 */
export async function addArtwork(input, options = {}) {
    const { commit: shouldCommit = true, push: shouldPush = false } = options;

    if (!input.imageBuffer) throw new Error("an image is required");
    if (!input.title) throw new Error("a title is required");
    if (!input.titleAr) throw new Error("an Arabic title is required");
    if (typeof input.price !== "number") throw new Error("a numeric price is required");

    const catalogue = await readCatalogue();
    const slug = uniqueSlug(slugify(input.title), catalogue);

    const image = await writeArtworkImage(input.imageBuffer, slug);
    const theme = await themeFromImage(input.imageBuffer);

    let { description, story } = input;
    if (!description || !story) {
        if (!copyConfigured()) {
            throw new Error(
                "no description/story supplied and no model configured " +
                "(set CURATOR_API_KEY and CURATOR_MODEL)"
            );
        }
        const written = await generateCopy(
            {
                title: input.title,
                medium: input.medium ?? "Mixed Media",
                size: input.size ?? "",
                year: input.year ?? new Date().getFullYear(),
                notes: input.notes,
            },
            { catalogue, imageBuffer: input.imageBuffer }
        );
        description = description ?? written.description;
        story = story ?? written.story;
    }

    const artwork = {
        slug,
        title: input.title,
        titleAr: input.titleAr,
        medium: input.medium ?? "Mixed Media",
        size: input.size ?? "",
        year: input.year ?? new Date().getFullYear(),
        price: input.price,
        image: image.path,
        description,
        story,
        theme,
        gridSpan: gridSpanFor(image.width, image.height),
    };

    const problems = validateArtwork(artwork);
    if (problems.length) {
        // Don't leave an orphaned image behind if the entry is rejected.
        await fs.unlink(path.join(process.cwd(), "public", image.path)).catch(() => { });
        throw new Error(`invalid entry: ${problems.join("; ")}`);
    }

    await writeCatalogue([...catalogue, artwork]);

    const changed = [CATALOGUE_PATH, `public${image.path}`];
    const sha = shouldCommit
        ? await repo.commit(changed, `content: add "${artwork.title}" to the gallery`)
        : null;
    if (shouldCommit && shouldPush) await repo.push();

    return { artwork, sha, image };
}

/** Remove a piece and its image. */
export async function removeArtwork(slug, options = {}) {
    const { commit: shouldCommit = true, push: shouldPush = false } = options;

    const catalogue = await readCatalogue();
    const artwork = catalogue.find((a) => a.slug === slug);
    if (!artwork) throw new Error(`no artwork with slug "${slug}"`);

    await writeCatalogue(catalogue.filter((a) => a.slug !== slug));

    const changed = [CATALOGUE_PATH];
    // Only remove the image if it isn't one of the original bundled files.
    if (artwork.image.endsWith(".webp")) {
        const onDisk = path.join(process.cwd(), "public", artwork.image);
        if (await fs.rm(onDisk, { force: true }).then(() => true).catch(() => false)) {
            changed.push(`public${artwork.image}`);
        }
    }

    const sha = shouldCommit
        ? await repo.commit(changed, `content: remove "${artwork.title}" from the gallery`)
        : null;
    if (shouldCommit && shouldPush) await repo.push();

    return { artwork, sha };
}

/** Change one field on an existing piece — price, or the sold flag. */
export async function updateArtwork(slug, changes, options = {}) {
    const { commit: shouldCommit = true, push: shouldPush = false } = options;

    const catalogue = await readCatalogue();
    const index = catalogue.findIndex((a) => a.slug === slug);
    if (index === -1) throw new Error(`no artwork with slug "${slug}"`);

    const allowed = ["price", "sold", "title", "titleAr", "description", "story", "size", "medium"];
    const rejected = Object.keys(changes).filter((k) => !allowed.includes(k));
    if (rejected.length) throw new Error(`cannot change: ${rejected.join(", ")}`);

    const updated = { ...catalogue[index], ...changes };
    const problems = validateArtwork(updated);
    if (problems.length) throw new Error(`invalid entry: ${problems.join("; ")}`);

    catalogue[index] = updated;
    await writeCatalogue(catalogue);

    const summary = Object.entries(changes)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
    const sha = shouldCommit
        ? await repo.commit([CATALOGUE_PATH], `content: update "${updated.title}" (${summary})`)
        : null;
    if (shouldCommit && shouldPush) await repo.push();

    return { artwork: updated, sha };
}

export { repo };
