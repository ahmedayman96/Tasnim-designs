/**
 * الأسطى as a conversational agent.
 *
 * Replaces the keyword router. The model holds the conversation, decides what to
 * do, and calls tools to do it — she can just talk.
 *
 * What is delegated: understanding her, choosing an action, writing English copy.
 * What is not: the tools below are the only things it can do, and each one still
 * validates its own arguments. The palette is still computed from the artwork's
 * pixels, the repo layer still refuses to stage anything outside the catalogue and
 * public/images, and a price still has to be a number she actually said.
 */
import { readCatalogue } from "./catalogue.mjs";
import { removeArtwork, updateArtwork, replaceArtworkImage } from "./index.mjs";
import { cropFromInstruction } from "./crop.mjs";

const SYSTEM = `You are "الأسطى" — the studio assistant for Tasnim Elyamani, an
Egyptian artist. You manage the gallery on her website, tasnimelyamani.com.

Talk to her like a person. She writes in Egyptian Arabic, English, or a mix, and
often sends voice notes, so expect transcription noise.

ALWAYS REPLY IN THE LANGUAGE SHE JUST USED. English message, English reply.
Arabic message, Egyptian Arabic reply. If she mixes, follow whichever dominates.
Never answer an English message in Arabic. Be warm, short and practical, no
corporate tone.

Titles, descriptions and stories on the site are written in English regardless of
which language she is speaking to you in — except the Arabic title, which is
Arabic. The site is bilingual; your chat language and the site's content language
are separate things.

WHAT YOU MANAGE
Each piece has: an English title, an Arabic title, medium, size, year, price,
a one-sentence description of what it looks like, and a story in her own first
person voice. The palette of each page is generated from the artwork's own
colours — you do not choose colours, and you cannot change the site's design.

HOUSE VOICE, for the description and story
Warm, unhurried, a little literary. Concrete over abstract — name real things.
Never "stunning", "captivating", "masterpiece", "journey", "evoke". Never mention
price or that it is for sale. Match the existing entries.

THINGS THAT MATTER
- The story is published as HER words, first person. Build it from what she tells
  you. Do not invent relatives, places, dates or events she has not mentioned. If
  she has told you nothing about a piece, leave the story empty rather than
  inventing a reason she made it.
- Never set a price she has not stated. If you are unsure of a number, ask.
- Arabic titles are hers. Ask rather than translating, unless she asks you to.
- You may describe what is visibly in the image — that is observation, not
  invention.

PICKING THE RIGHT PIECE
Never invent a slug. Several pieces have similar or identical titles — there are
two called "Blue Geode" and two called "Flowing Form" — so a slug you assemble
yourself will usually be wrong. Use a slug exactly as it appears in the list you
were given, or call list_artworks first. If a tool tells you the piece is
ambiguous, ask her which one and describe them so she can tell them apart.

IF A TOOL RETURNS AN ERROR, THE WORK DID NOT HAPPEN
Say so, in her language, and say what went wrong. Never reply "done" or "تمام"
after a failed call. If the error lists candidates, look at them and either retry
with the right one or ask her. Telling her a piece was deleted when it is still on
her website is worse than any error message.

Do what she asks without narrating your plan. Confirm briefly once it's done. If
she asks for something you have no tool for — changing the site's design, adding
a page, anything about payments — say plainly that it's not something you can do
and she should ask Ahmed.`;

const TOOLS = [
    {
        type: "function",
        function: {
            name: "list_artworks",
            description: "List every piece currently on the site with its price and status.",
            parameters: { type: "object", properties: {}, required: [] },
        },
    },
    {
        type: "function",
        function: {
            name: "update_artwork",
            description:
                "Change one or more fields on a piece. Only pass the fields being changed.",
            parameters: {
                type: "object",
                properties: {
                    slug: { type: "string", description: "the piece's slug" },
                    title: { type: "string" },
                    titleAr: { type: "string", description: "Arabic title, in Arabic script" },
                    medium: { type: "string" },
                    size: { type: "string" },
                    price: {
                        type: "number",
                        description: "USD. Only a number she has actually stated.",
                    },
                    sold: { type: "boolean" },
                    story: {
                        type: "string",
                        description:
                            "Her first-person account, in the house voice, built only from " +
                            "what she has told you. Never invented.",
                    },
                    description: {
                        type: "string",
                        description: "One sentence on what the work looks like.",
                    },
                },
                required: ["slug"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "delete_artwork",
            description: "Remove a piece from the site completely, along with its image.",
            parameters: {
                type: "object",
                properties: { slug: { type: "string" } },
                required: ["slug"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "crop_artwork_photo",
            description:
                "Re-frame a piece using part of the photo she originally sent — when one " +
                "photo held several paintings, or the framing was wrong. Recomputes the " +
                "palette and description from the new crop.",
            parameters: {
                type: "object",
                properties: {
                    slug: { type: "string" },
                    region: {
                        type: "string",
                        description:
                            "Which part, in her words — e.g. 'the left one', 'الشمال', " +
                            "'the one with the flowers'.",
                    },
                },
                required: ["slug", "region"],
            },
        },
    },
];

/**
 * @param {object} deps
 * @param {() => Buffer|undefined} deps.originalPhoto  the uncropped photo for this chat
 * @param {(text: string) => Promise<void>} deps.notify progress back to Telegram
 */

/**
 * Turn whatever the model passed into a real slug.
 *
 * It guesses: asked to delete "Gold Veins" it invented "gold-veins-2", the call
 * failed, and it told her the piece was gone. So accept a slug or a title, match
 * loosely, and when several pieces could be meant say so instead of picking one —
 * she has two "Blue Geode" and two "Flowing Form".
 *
 * @returns {{slug: string} | {error: string, candidates?: string[]}}
 */
function resolveSlug(wanted, catalogue) {
    const all = catalogue.map((a) => a.slug);
    if (!wanted) return { error: "no slug given", candidates: all };

    const norm = (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, "");
    const target = norm(wanted);

    // An exact slug is unambiguous by definition and always wins.
    const exact = catalogue.find((a) => a.slug === wanted);
    if (exact) return { slug: exact.slug };

    // Ambiguity is checked before any loose matching. "Blue Geode" normalises onto
    // the slug blue-geode, but two pieces carry that title — silently taking the
    // first would delete whichever happened to be added first.
    const byTitle = catalogue.filter((a) => norm(a.title) === target);
    if (byTitle.length > 1) {
        return {
            error:
                `"${wanted}" matches ${byTitle.length} pieces. Ask her which one, ` +
                `describing them so she can tell them apart.`,
            candidates: byTitle.map((a) => a.slug),
        };
    }

    const bySlug = catalogue.filter((a) => norm(a.slug) === target);
    if (bySlug.length === 1) return { slug: bySlug[0].slug };
    if (byTitle.length === 1) return { slug: byTitle[0].slug };

    // Last resort: a prefix match, which catches the invented "-2" and "-3" suffixes.
    const near = catalogue.filter(
        (a) => norm(a.slug).startsWith(target) || target.startsWith(norm(a.slug))
    );
    if (near.length === 1) return { slug: near[0].slug };
    if (near.length > 1) {
        return {
            error: `"${wanted}" is ambiguous. Ask her which one she means.`,
            candidates: near.map((a) => a.slug),
        };
    }

    return {
        error: `There is nothing called "${wanted}". Do NOT tell her it was done.`,
        candidates: all,
    };
}

async function runTool(name, args, deps) {
    switch (name) {
        case "list_artworks": {
            const catalogue = await readCatalogue();
            return catalogue.map((a) => ({
                slug: a.slug,
                title: a.title,
                titleAr: a.titleAr || null,
                price: a.price,
                sold: Boolean(a.sold),
                hasStory: Boolean(a.story),
            }));
        }

        case "update_artwork": {
            const { slug: asked, ...changes } = args;
            const found = resolveSlug(asked, await readCatalogue());
            if (found.error) return found;
            const slug = found.slug;
            if (changes.price !== undefined) {
                const n = Number(changes.price);
                if (!Number.isFinite(n) || n <= 0) {
                    return { error: "price must be a positive number" };
                }
                changes.price = n;
            }
            if (!Object.keys(changes).length) return { error: "nothing to change" };
            const { artwork } = await updateArtwork(slug, changes, { commit: true, push: true });
            return { ok: true, slug: artwork.slug, changed: Object.keys(changes) };
        }

        case "delete_artwork": {
            const found = resolveSlug(args.slug, await readCatalogue());
            if (found.error) return found;
            const { artwork } = await removeArtwork(found.slug, { commit: true, push: true });
            return { ok: true, deleted: artwork.title, slug: found.slug };
        }

        case "crop_artwork_photo": {
            const foundCrop = resolveSlug(args.slug, await readCatalogue());
            if (foundCrop.error) return foundCrop;
            args = { ...args, slug: foundCrop.slug };
            const original = deps.originalPhoto();
            if (!original) {
                return { error: "I no longer have the original photo — ask her to resend it." };
            }
            const cropped = await cropFromInstruction(original, args.region);
            if (!cropped) return { error: "could not work out which part she meant" };
            const { artwork } = await replaceArtworkImage(args.slug, cropped, {
                commit: true,
                push: true,
            });
            return { ok: true, slug: artwork.slug, description: artwork.description };
        }

        default:
            return { error: `no such tool: ${name}` };
    }
}

/**
 * One turn of conversation. `history` is mutated so the caller keeps context
 * across messages.
 */
export async function respond(history, deps) {
    const key = process.env.CURATOR_API_KEY;
    const model = process.env.CURATOR_MODEL;
    if (!key || !model) throw new Error("CURATOR_API_KEY and CURATOR_MODEL must be set");

    const catalogue = await readCatalogue();
    const context =
        `On the site right now:\n` +
        catalogue
            .map(
                (a) =>
                    `- ${a.slug}: "${a.title}"${a.titleAr ? ` / ${a.titleAr}` : ""}, ` +
                    `${a.price === null ? "no price yet" : `$${a.price}`}` +
                    `${a.sold ? ", sold" : ""}${a.story ? "" : ", no story yet"}`
            )
            .join("\n") +
        (deps.focusSlug ? `\n\nShe is talking about: ${deps.focusSlug}` : "");

    // Up to a few rounds so it can chain calls — look something up, then change it.
    for (let round = 0; round < 5; round += 1) {
        const res = await fetch(
            process.env.CURATOR_API_URL || "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
                body: JSON.stringify({
                    model,
                    temperature: 0.6,
                    max_tokens: 900,
                    tools: TOOLS,
                    messages: [
                        { role: "system", content: SYSTEM },
                        { role: "system", content: context },
                        ...history,
                    ],
                }),
            }
        );

        if (!res.ok) {
            throw new Error(`agent failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
        }

        const message = (await res.json()).choices?.[0]?.message;
        if (!message) throw new Error("empty reply from the model");
        history.push(message);

        const calls = message.tool_calls ?? [];
        if (!calls.length) return message.content ?? "";

        for (const call of calls) {
            let result;
            try {
                const args = JSON.parse(call.function.arguments || "{}");
                console.log(`  tool ${call.function.name}(${JSON.stringify(args).slice(0, 120)})`);
                result = await runTool(call.function.name, args, deps);
            } catch (err) {
                result = { error: err.message };
            }
            history.push({
                role: "tool",
                tool_call_id: call.id,
                content: JSON.stringify(result).slice(0, 4000),
            });
        }
    }

    return "خلصت، بس اتلخبطت شوية — تحبي تقوليلي تاني؟";
}
