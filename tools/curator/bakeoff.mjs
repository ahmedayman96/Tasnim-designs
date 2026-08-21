#!/usr/bin/env node
/**
 * Compare candidate models on the real task, using a real artwork whose copy
 * Tasnim already wrote — so the output can be judged against a known-good answer
 * rather than on vibes.
 *
 *   node --env-file=.env.local tools/curator/bakeoff.mjs
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { generateCopy } from "./copy.mjs";
import { readCatalogue } from "./catalogue.mjs";

const CANDIDATES = process.argv.slice(2).length
    ? process.argv.slice(2)
    : [
        "google/gemma-4-31b-it:free",
        "dots-studio/dots-3-note-preview:free",
        "z-ai/glm-5.2:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
    ];

// The piece we test on. Held out of the few-shot examples so the model can't
// simply copy the answer back.
const TARGET = "cubist-portrait";

// Roughly what she'd thumb into a chat — terse, true, unpolished. The test is
// whether a model expands this into the house voice WITHOUT inventing around it.
const NOTES =
    "faces aren't flat, they're planes of light shifting. newspaper pieces = " +
    "memories stacked on each other, old stories underneath";

const wrap = (text, indent = 4) =>
    text.replace(/(.{1,88})(\s|$)/g, `${" ".repeat(indent)}$1\n`).trimEnd();

async function main() {
    const catalogue = await readCatalogue();
    const target = catalogue.find((a) => a.slug === TARGET);
    const examples = catalogue.filter((a) => a.slug !== TARGET);
    const image = await fs.readFile(
        path.join(process.cwd(), "public", target.image)
    );

    console.log("=".repeat(92));
    console.log(`TARGET: ${target.title} — ${target.medium}, ${target.year}`);
    console.log("=".repeat(92));
    console.log("\nWHAT TASNIM ACTUALLY WROTE:\n");
    console.log(wrap(target.description));
    console.log();
    console.log(wrap(target.story));

    for (const model of CANDIDATES) {
        console.log(`\n${"=".repeat(92)}\n${model}\n${"-".repeat(92)}`);
        process.env.CURATOR_MODEL = model;
        const started = Date.now();
        try {
            const out = await generateCopy(
                {
                    title: target.title,
                    medium: target.medium,
                    size: target.size,
                    year: target.year,
                    // The kind of half-sentence she'd actually type into Telegram.
                    notes: NOTES,
                },
                { catalogue: examples, imageBuffer: image }
            );
            const secs = ((Date.now() - started) / 1000).toFixed(1);
            console.log(`  (${secs}s)\n`);
            console.log(wrap(out.description));
            console.log();
            console.log(wrap(out.story));
        } catch (err) {
            console.log(`  FAILED: ${err.message.slice(0, 220)}`);
        }
    }
    console.log(`\n${"=".repeat(92)}`);
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});
