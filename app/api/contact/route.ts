import { NextResponse } from "next/server";

/**
 * The contact form's delivery.
 *
 * Enquiries go to Tasnim's Telegram, using the bot and chat id the curator tool
 * already uses (`tools/curator`). That reaches her phone immediately, which is
 * how she already works with the site, and it adds no new service and no new
 * secret to the deployment.
 *
 * The env is read inside the handler, never at module scope — `lib/stripe.ts`
 * throws at import and that is what makes a build fail on a machine without the
 * keys. A missing token here degrades to a clear message instead.
 */

const MAX = { name: 120, email: 200, subject: 160, message: 4000 } as const;

/** Telegram is sent `parse_mode: HTML`, so anything a stranger typed is escaped. */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/**
 * Best-effort flood control, per IP, in memory. Serverless instances do not share
 * this and it resets on a cold start, so it stops a naive loop rather than a
 * determined attacker — enough to keep her phone usable.
 */
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 4;

function rateLimited(ip: string): boolean {
    const now = Date.now();
    const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    hits.push(now);
    recent.set(ip, hits);
    if (recent.size > 500) {
        for (const [key, times] of recent) {
            if (times.every((t) => now - t >= WINDOW_MS)) recent.delete(key);
        }
    }
    return hits.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, subject, message, company } = body ?? {};

        // Honeypot: a field hidden from people and irresistible to bots. Answer 200
        // so the bot believes it worked and does not come back to try again.
        if (typeof company === "string" && company.trim() !== "") {
            return NextResponse.json({ ok: true });
        }

        const clean = (value: unknown, limit: number) =>
            typeof value === "string" ? value.trim().slice(0, limit) : "";

        const data = {
            name: clean(name, MAX.name),
            email: clean(email, MAX.email),
            subject: clean(subject, MAX.subject),
            message: clean(message, MAX.message),
        };

        if (!data.name || !data.email || !data.message) {
            return NextResponse.json(
                { error: "Please fill in your name, your email and a message." },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            return NextResponse.json(
                { error: "That email address doesn't look right." },
                { status: 400 }
            );
        }

        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";

        if (rateLimited(ip)) {
            return NextResponse.json(
                { error: "That's a few messages in a row — please try again shortly." },
                { status: 429 }
            );
        }

        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = (process.env.TELEGRAM_ALLOWED_IDS || "")
            .split(/[,\s]+/)
            .filter(Boolean)[0];

        if (!token || !chatId) {
            console.error("contact: TELEGRAM_BOT_TOKEN or TELEGRAM_ALLOWED_IDS is not set");
            return NextResponse.json(
                { error: "The form is not available right now — please book a call instead." },
                { status: 503 }
            );
        }

        const text = [
            "✉️ <b>New enquiry from the website</b>",
            "",
            `<b>From:</b> ${escapeHtml(data.name)}`,
            `<b>Email:</b> ${escapeHtml(data.email)}`,
            data.subject ? `<b>About:</b> ${escapeHtml(data.subject)}` : null,
            "",
            escapeHtml(data.message),
        ]
            .filter((line) => line !== null)
            .join("\n");

        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "HTML",
                disable_web_page_preview: true,
            }),
        });

        if (!response.ok) {
            // Telegram's own reason matters when this goes wrong in production, but
            // the sender only needs to know it did not arrive.
            console.error("contact: telegram rejected the message", await response.text());
            return NextResponse.json(
                { error: "That didn't send. Please try again, or book a call." },
                { status: 502 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("contact: unexpected failure", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
