#!/usr/bin/env node
/**
 * "الأسطى" — Telegram bot for the gallery.
 *
 *   node --env-file=.env.local tools/curator/bot.mjs
 *
 * Send a photo and it goes up. Everything else is a conversation — she just says
 * what she wants, typed or spoken, in Arabic or English, and the agent in
 * agent.mjs decides what to do. This file only carries messages between Telegram
 * and the agent; it makes no decisions of its own.
 *
 * Raw Bot API over long polling: no dependencies, no webhook, no public IP.
 */
import { addArtwork, repo } from "./index.mjs";
import { respond } from "./agent.mjs";
import { transcribe } from "./transcribe.mjs";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;
const FILE_API = `https://api.telegram.org/file/bot${TOKEN}`;
const SITE = process.env.SITE_URL || "https://tasnimelyamani.com";

const ALLOWED = (process.env.TELEGRAM_ALLOWED_IDS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);

if (!TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    process.exit(1);
}

// ---------------------------------------------------------------- Telegram ---

async function tg(method, payload) {
    const res = await fetch(`${API}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`${method}: ${data.description}`);
    return data.result;
}

const say = (chat, text) =>
    tg("sendMessage", { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: false });

async function download(fileId) {
    const file = await tg("getFile", { file_id: fileId });
    const res = await fetch(`${FILE_API}/${file.file_path}`);
    if (!res.ok) throw new Error(`could not download file (${res.status})`);
    return {
        buffer: Buffer.from(await res.arrayBuffer()),
        name: file.file_path.split("/").pop(),
    };
}

/** Telegram sends several resolutions; the last is the largest. */
async function downloadPhoto(photoSizes) {
    return (await download(photoSizes[photoSizes.length - 1].file_id)).buffer;
}

// ------------------------------------------------------------------- State ---

/**
 * The piece each chat is currently talking about — edits apply to it.
 * Keeps the original uncropped photo so "actually, just the left one" still works
 * after the piece has already gone up.
 */
const focus = new Map();
const focusSlug = (chat) => focus.get(chat)?.slug;

const money = (n) => (typeof n === "number" ? `$${n.toLocaleString("en-US")}` : "من غير سعر");

/**
 * The site rebuilds after a push, so only claim it's live once the page serves.
 */
async function waitForLive(slug, timeoutMs = 240000) {
    const url = `${SITE}/artwork/${slug}`;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(url, { method: "HEAD", redirect: "follow" })).ok) return url;
        } catch { /* still building */ }
        await new Promise((r) => setTimeout(r, 10000));
    }
    return null;
}

function card(artwork, live) {
    const missing = [];
    if (!artwork.titleAr) missing.push("«بالعربي ...» للاسم العربي");
    if (artwork.price === null) missing.push("«السعر ١٤٠٠» عشان تتباع");
    if (!artwork.story) missing.push("«احكي ...» بكلامك انتي عن اللوحة");

    return (
        `🖼 <b>${artwork.title}</b>${artwork.titleAr ? ` — ${artwork.titleAr}` : ""}\n` +
        `${money(artwork.price)}\n\n` +
        `<i>${artwork.description}</i>\n` +
        (artwork.story ? `\n${artwork.story}\n` : "") +
        (live ? `\n${live}\n` : "") +
        (missing.length ? `\nناقص لسه:\n• ${missing.join("\n• ")}\n` : "") +
        `\n«تراجع» لو عايزة تشيليها`
    );
}

async function publishAndReport(chat, artwork, prefix, original) {
    await repo.push();
    const previous = focus.get(chat);
    focus.set(chat, {
        slug: artwork.slug,
        original: original ?? (previous?.slug === artwork.slug ? previous.original : undefined),
    });
    const live = await waitForLive(artwork.slug);
    await say(chat, (prefix ? `${prefix}\n\n` : "") + card(artwork, live));
}

// ---------------------------------------------------------- Conversation ---

/** Recent turns per chat, so she can say "and that one too". */
const conversations = new Map();

function historyFor(chat) {
    if (!conversations.has(chat)) conversations.set(chat, []);
    const history = conversations.get(chat);
    // Keep it bounded; older turns stop being useful and cost tokens.
    if (history.length > 24) history.splice(0, history.length - 24);
    return history;
}

async function converse(chat, text) {
    const history = historyFor(chat);
    history.push({ role: "user", content: text });

    const reply = await respond(history, {
        focusSlug: focusSlug(chat),
        originalPhoto: () => focus.get(chat)?.original,
        notify: (t) => say(chat, t),
    });

    if (reply) await say(chat, reply);
}

// ----------------------------------------------------------------- Router ---

async function handleMessage(message) {
    const chat = message.chat.id;
    const from = message.from;

    if (!ALLOWED.length) {
        console.log(`[id] ${from.id}  ${from.first_name ?? ""} @${from.username ?? "-"}`);
        await say(chat, `👋 Your Telegram ID is <code>${from.id}</code>\n\nAdd it to TELEGRAM_ALLOWED_IDS and restart me.`);
        return;
    }
    if (!ALLOWED.includes(String(from.id))) {
        console.log(`[denied] ${from.id} @${from.username ?? "-"}`);
        return;
    }

    let text = (message.text ?? message.caption ?? "").trim();

    // A voice note becomes text and then follows exactly the same path as typing,
    // so she can speak any instruction, not just the story.
    const audio = message.voice ?? message.audio;
    if (audio) {
        await say(chat, "🎧 بسمع…");
        const { buffer, name } = await download(audio.file_id);
        text = await transcribe(buffer, name || "voice.ogg");
        // Always show it back — a mis-heard word would otherwise be published in
        // her voice without her ever seeing it.
        await say(chat, `سمعت:\n<i>«${text}»</i>`);
    }

    // A photo always means a new piece; it goes up straight away.
    if (message.photo) {
        await say(chat, "📸 وصلتني… بجهزها");
        const original = await downloadPhoto(message.photo);
        const { artwork } = await addArtwork(
            { imageBuffer: original, notes: text || undefined },
            { commit: true }
        );
        await publishAndReport(chat, artwork, "🚀 نزلت", original);

        // Let the agent know, so "make it 1400" next message has something to act on.
        historyFor(chat).push({
            role: "user",
            content:
                `[she sent a photo of a new piece; it is now on the site as ` +
                `slug "${artwork.slug}", titled "${artwork.title}", no price set` +
                `${text ? `. She said: ${text}` : ""}]`,
        });
        return;
    }

    if (!text) return;

    // Everything else is just conversation.
    await tg("sendChatAction", { chat_id: chat, action: "typing" }).catch(() => { });
    await converse(chat, text);
}

// --------------------------------------------------------------- Long poll ---

async function main() {
    const me = await tg("getMe", {});
    console.log(`الأسطى running as @${me.username}`);
    console.log(ALLOWED.length
        ? `allowed ids: ${ALLOWED.join(", ")}`
        : "no allow-list yet — message the bot and it will report your id");

    let offset = 0;
    for (;;) {
        try {
            const updates = await tg("getUpdates", { offset, timeout: 30, allowed_updates: ["message"] });
            for (const update of updates) {
                offset = update.update_id + 1;
                if (!update.message) continue;
                try {
                    await handleMessage(update.message);
                } catch (err) {
                    console.error("handler:", err.message);
                    await say(update.message.chat.id, `❌ ${err.message.slice(0, 200)}`).catch(() => { });
                }
            }
        } catch (err) {
            // Two instances polling means one silently steals every message and
            // the other looks alive while doing nothing — which cost us an
            // afternoon of "the voice notes don't work". Fail loudly instead.
            if (/Conflict/i.test(err.message)) {
                console.error(
                    "\nAnother الأسطى is already running and is receiving the messages.\n" +
                    "Stop it before starting this one:\n" +
                    "  Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" |\n" +
                    "    Where-Object { $_.CommandLine -like '*curator*bot.mjs*' } |\n" +
                    "    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }\n"
                );
                process.exit(1);
            }
            console.error("poll:", err.message);
            await new Promise((r) => setTimeout(r, 5000));
        }
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
