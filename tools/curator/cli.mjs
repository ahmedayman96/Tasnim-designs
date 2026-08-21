#!/usr/bin/env node
/**
 * Command line front end for the curator, so every operation can be exercised
 * without a Telegram token. The bot is a thin wrapper over the same functions.
 *
 *   node tools/curator/cli.mjs add --image ./p.jpg --title "Golden Hour" \
 *        --title-ar "ساعة الذهب" --price 1400 [--medium "..."] [--size "..."] [--push]
 *   node tools/curator/cli.mjs list
 *   node tools/curator/cli.mjs remove --slug golden-hour
 *   node tools/curator/cli.mjs update --slug golden-hour --price 1600
 *   node tools/curator/cli.mjs update --slug golden-hour --sold
 *   node tools/curator/cli.mjs undo
 */
import { promises as fs } from "node:fs";
import { addArtwork, removeArtwork, updateArtwork, repo } from "./index.mjs";
import { readCatalogue } from "./catalogue.mjs";

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (!token.startsWith("--")) continue;
        const key = token.slice(2);
        const next = argv[i + 1];
        if (!next || next.startsWith("--")) {
            args[key] = true;
        } else {
            args[key] = next;
            i += 1;
        }
    }
    return args;
}

function money(n) {
    return `$${n.toLocaleString("en-US")}`;
}

async function main() {
    const [command, ...rest] = process.argv.slice(2);
    const args = parseArgs(rest);
    const shouldPush = Boolean(args.push);
    const shouldCommit = !args["no-commit"];

    switch (command) {
        case "list": {
            const catalogue = await readCatalogue();
            for (const a of catalogue) {
                const tag = a.sold ? " [SOLD]" : "";
                console.log(
                    `${a.slug.padEnd(22)} ${money(a.price).padStart(8)}  ${a.title}${tag}`
                );
            }
            console.log(`\n${catalogue.length} pieces`);
            break;
        }

        case "add": {
            if (!args.image) throw new Error("--image is required");
            if (!args.title) throw new Error("--title is required");
            if (!args["title-ar"]) throw new Error("--title-ar is required");
            if (!args.price) throw new Error("--price is required");

            if (shouldCommit) await repo.assertCleanTree();

            const imageBuffer = await fs.readFile(args.image);
            console.log(`Adding "${args.title}"…`);

            const { artwork, sha } = await addArtwork(
                {
                    imageBuffer,
                    title: args.title,
                    titleAr: args["title-ar"],
                    price: Number(args.price),
                    medium: args.medium,
                    size: args.size,
                    year: args.year ? Number(args.year) : undefined,
                    description: args.description,
                    story: args.story,
                },
                { commit: shouldCommit, push: shouldPush }
            );

            console.log(`\n  slug        ${artwork.slug}`);
            console.log(`  price       ${money(artwork.price)}`);
            console.log(`  image       ${artwork.image}`);
            console.log(`  tile        ${artwork.gridSpan}`);
            console.log(`  theme       ${artwork.theme.bg} / ${artwork.theme.accent} / ${artwork.theme.textColor}`);
            console.log(`  gradient    ${artwork.theme.gradient}`);
            console.log(`\n  ${artwork.description}`);
            console.log(`\n  ${artwork.story}\n`);
            if (sha) console.log(`  committed   ${sha.slice(0, 8)}`);
            if (shouldPush) console.log("  pushed to origin");
            break;
        }

        case "remove": {
            if (!args.slug) throw new Error("--slug is required");
            if (shouldCommit) await repo.assertCleanTree();
            const { artwork, sha } = await removeArtwork(args.slug, {
                commit: shouldCommit,
                push: shouldPush,
            });
            console.log(`Removed "${artwork.title}"`);
            if (sha) console.log(`  committed ${sha.slice(0, 8)}`);
            break;
        }

        case "update": {
            if (!args.slug) throw new Error("--slug is required");
            if (shouldCommit) await repo.assertCleanTree();

            const changes = {};
            if (args.price) changes.price = Number(args.price);
            if (args.sold) changes.sold = true;
            if (args.unsold) changes.sold = false;
            if (args.title) changes.title = args.title;
            if (args["title-ar"]) changes.titleAr = args["title-ar"];
            if (!Object.keys(changes).length) throw new Error("nothing to change");

            const { artwork, sha } = await updateArtwork(args.slug, changes, {
                commit: shouldCommit,
                push: shouldPush,
            });
            console.log(`Updated "${artwork.title}" — ${money(artwork.price)}${artwork.sold ? " [SOLD]" : ""}`);
            if (sha) console.log(`  committed ${sha.slice(0, 8)}`);
            break;
        }

        case "undo": {
            const sha = await repo.lastCommitSha();
            const reverted = await repo.revert(sha);
            console.log(`Reverted ${sha.slice(0, 8)} → ${reverted.slice(0, 8)}`);
            if (shouldPush) {
                await repo.push();
                console.log("  pushed to origin");
            }
            break;
        }

        default:
            console.error("commands: list | add | remove | update | undo");
            process.exitCode = 1;
    }
}

main().catch((err) => {
    console.error(`\n✗ ${err.message}\n`);
    process.exitCode = 1;
});
