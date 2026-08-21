#!/usr/bin/env node
/**
 * "الأسطى" — a Telegram bot that adds work to the gallery.
 *
 *   node --env-file=.env.local tools/curator/bot.mjs
 *
 * Talks to the Telegram Bot API directly over long polling: no dependencies, no
 * webhook, no public IP, works from behind a home router. It collects a photo and
 * four answers, then calls addArtwork() — it has no other capabilities, and the
 * curator itself refuses to write anywhere but the catalogue and public/images.
 */
import { addArtwork, removeArtwork, updateArtwork, repo } from "./index.mjs";
import { readCatalogue } from "./catalogue.mjs";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;
const FILE_API = `https://api.telegram.org/file/bot${TOKEN}`;
const SITE = process.env.SITE_URL || "https://tasnimelyamani.com";

const ALLOWED = (process.env.TELEGRAM_ALLOWED_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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

const say = (chat, text, extra = {}) =>
    tg("sendMessage", { chat_id: chat, text, parse_mode: "HTML", ...extra });

async function downloadPhoto(photoSizes) {
    // Telegram sends several resolutions; the last is the largest.
    const largest = photoSizes[photoSizes.length - 1];
    const file = await tg("getFile", { file_id: largest.file_id });
    const res = await fetch(`${FILE_API}/${file.file_path}`);
    if (!res.ok) throw new Error(`could not download photo (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
}

// ------------------------------------------------------------------- State ---

/** One in-flight submission per chat. Lost on restart, which is fine — she just resends. */
const sessions = new Map();
/** Last published commit per chat, so "تراجع" knows what to undo. */
const lastPublished = new Map();

const STEPS = ["title", "titleAr", "notes", "price", "confirm"];

const ASK = {
    title: "📛 اسم العمل بالإنجليزي؟\n<i>English title</i>",
    titleAr: "🇪🇬 والاسم بالعربي؟",
    notes:
        "✍️ احكيلي عن اللوحة — أي حاجة، كلمتين كفاية.\n" +
        "<i>Tell me about it in your own words — I'll only use what you say, " +
        "I won't make anything up.</i>",
    price: "💵 السعر بالدولار؟ (أرقام بس)",
};

function money(n) {
    return `$${n.toLocaleString("en-US")}`;
}

// -------------------------------------------------------------- Publishing ---

/**
 * The site rebuilds after a push, so "it's live" is only true once the new page
 * actually serves. Poll it rather than guessing at a deploy time.
 */
async function waitForLive(slug, timeoutMs = 240000) {
    const url = `${SITE}/artwork/${slug}`;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(url, { method: "HEAD", redirect: "follow" });
            if (res.ok) return url;
        } catch { /* deploy in progress */ }
        await new Promise((r) => setTimeout(r, 10000));
    }
    return null;
}

async function publish(chat, session) {
    await say(chat, "⏳ ثانية واحدة… بجهز اللوحة");

    const { artwork, sha } = await addArtwork(
        {
            imageBuffer: session.imageBuffer,
            title: session.title,
            titleAr: session.titleAr,
            price: session.price,
            notes: session.notes,
            medium: session.medium,
            size: session.size,
        },
        { commit: true, push: true }
    );

    lastPublished.set(chat, { sha, title: artwork.title });

    await say(
        chat,
        `✅ <b>${artwork.title}</b> — ${money(artwork.price)}\n\n` +
        `<i>${artwork.description}</i>\n\n` +
        `${artwork.story}\n\n` +
        `🚀 بنشرها دلوقتي… هستناها تطلع وأقولك.`
    );

    const url = await waitForLive(artwork.slug);
    if (url) {
        await say(chat, `🎉 نزلت!\n${url}\n\nلو عايزة تلغيها اكتب <b>تراجع</b>`);
    } else {
        await say(
            chat,
            "تم الرفع، بس الموقع لسه بيبني. جربي اللينك بعد شوية:\n" +
            `${SITE}/artwork/${artwork.slug}`
        );
    }
}

// ---------------------------------------------------------------- Handlers ---

async function handleCommand(chat, text) {
    const command = text.trim().toLowerCase();

    if (command === "/start" || command === "/help") {
        await say(
            chat,
            "أهلاً يا فنانة 👋 أنا <b>الأسطى</b>.\n\n" +
            "ابعتيلي <b>صورة</b> اللوحة وأنا هسألك على الباقي وأنشرها على الموقع.\n\n" +
            "الأوامر:\n" +
            "/list — اللوحات اللي على الموقع\n" +
            "/cancel — إلغاء اللي بنعمله دلوقتي\n" +
            "<b>تراجع</b> — إلغاء آخر لوحة نشرتها"
        );
        return true;
    }

    if (command === "/list") {
        const catalogue = await readCatalogue();
        const lines = catalogue.map(
            (a) => `• ${a.title} — ${money(a.price)}${a.sold ? " (اتباعت)" : ""}`
        );
        await say(chat, `🖼 <b>${catalogue.length} لوحات</b>\n\n${lines.join("\n")}`);
        return true;
    }

    if (command === "/cancel") {
        sessions.delete(chat);
        await say(chat, "تمام، لغيت. ابعتي صورة تاني لما تكوني جاهزة.");
        return true;
    }

    if (text.trim() === "تراجع" || command === "/undo") {
        const last = lastPublished.get(chat);
        if (!last) {
            await say(chat, "مفيش حاجة أتراجع عنها.");
            return true;
        }
        await say(chat, `⏪ بشيل «${last.title}»…`);
        await repo.revert(last.sha);
        await repo.push();
        lastPublished.delete(chat);
        await say(chat, "اتشالت. هتختفي من الموقع خلال دقيقتين.");
        return true;
    }

    return false;
}

async function handleMessage(message) {
    const chat = message.chat.id;
    const from = message.from;

    // Access control. With no allow-list configured, report the id and refuse —
    // that's how the ids get collected in the first place.
    if (!ALLOWED.length) {
        console.log(`[id] ${from.id}  ${from.first_name ?? ""} @${from.username ?? "-"}`);
        await say(
            chat,
            `👋 Your Telegram ID is <code>${from.id}</code>\n\n` +
            "Add it to TELEGRAM_ALLOWED_IDS in .env.local and restart me."
        );
        return;
    }
    if (!ALLOWED.includes(String(from.id))) {
        console.log(`[denied] ${from.id} @${from.username ?? "-"}`);
        return; // Silence is the right reply to strangers.
    }

    const text = message.text ?? message.caption ?? "";

    if (text.startsWith("/") || text.trim() === "تراجع") {
        if (await handleCommand(chat, text)) return;
    }

    // A photo starts a new submission.
    if (message.photo) {
        await say(chat, "📸 وصلتني الصورة");
        const imageBuffer = await downloadPhoto(message.photo);
        sessions.set(chat, { imageBuffer, step: 0 });
        await say(chat, ASK.title);
        return;
    }

    const session = sessions.get(chat);
    if (!session) {
        await say(chat, "ابعتيلي صورة اللوحة الأول 📸");
        return;
    }

    const step = STEPS[session.step];
    const answer = text.trim();
    if (!answer) return;

    switch (step) {
        case "title":
            session.title = answer;
            session.step += 1;
            await say(chat, ASK.titleAr);
            break;

        case "titleAr":
            session.titleAr = answer;
            session.step += 1;
            await say(chat, ASK.notes);
            break;

        case "notes":
            session.notes = answer;
            session.step += 1;
            await say(chat, ASK.price);
            break;

        case "price": {
            const price = Number(answer.replace(/[^0-9.]/g, ""));
            if (!Number.isFinite(price) || price <= 0) {
                await say(chat, "اكتبي رقم بس، زي 1400");
                return;
            }
            session.price = price;
            session.step += 1;
            // The one confirmation: a typo here is a real price on a live shop.
            await say(
                chat,
                `تأكيد: <b>${session.title}</b> بسعر <b>${money(price)}</b>؟\n\n` +
                "اكتبي <b>نعم</b> للنشر، أو <b>لأ</b> لتغيير السعر."
            );
            break;
        }

        case "confirm": {
            if (/^(لا|لأ|no)$/i.test(answer)) {
                session.step = STEPS.indexOf("price");
                await say(chat, ASK.price);
                return;
            }
            if (!/^(نعم|ايوه|أيوه|اه|آه|yes|y)$/i.test(answer)) {
                await say(chat, "اكتبي <b>نعم</b> أو <b>لأ</b>");
                return;
            }
            sessions.delete(chat);
            try {
                await publish(chat, session);
            } catch (err) {
                console.error(err);
                await say(chat, `❌ حصلت مشكلة:\n<code>${err.message.slice(0, 300)}</code>`);
            }
            break;
        }
    }
}

// --------------------------------------------------------------- Long poll ---

async function main() {
    const me = await tg("getMe", {});
    console.log(`الأسطى running as @${me.username}`);
    console.log(
        ALLOWED.length
            ? `allowed ids: ${ALLOWED.join(", ")}`
            : "no allow-list yet — message the bot and it will report your id"
    );

    let offset = 0;
    for (;;) {
        try {
            const updates = await tg("getUpdates", {
                offset,
                timeout: 30,
                allowed_updates: ["message"],
            });
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
            console.error("poll:", err.message);
            await new Promise((r) => setTimeout(r, 5000));
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
