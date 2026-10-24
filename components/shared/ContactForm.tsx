"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Status = "idle" | "sending" | "sent" | "error";

const SUBJECTS = [
    "A commissioned piece",
    "A piece in the gallery",
    "Interior design",
    "Drawings — 2D / 3D",
    "Something else",
];

/**
 * The written way in, beside the calendar.
 *
 * A call suits someone ready to talk; plenty of people would rather send a note
 * and get on with their day, and an enquiry that needs a drawing described is
 * easier typed than spoken.
 */
export default function ContactForm() {
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));

        setStatus("sending");
        setError(null);

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (!response.ok) {
                setError(result?.error ?? "That didn't send. Please try again.");
                setStatus("error");
                return;
            }

            form.reset();
            setStatus("sent");
        } catch {
            setError("That didn't send — check your connection and try again.");
            setStatus("error");
        }
    }

    const field =
        "w-full rounded-xl bg-midnight/60 border border-gold/15 focus:border-gold/50 " +
        "text-cream placeholder:text-warm-gray/50 text-sm px-4 py-3 outline-none " +
        "transition-colors focus:ring-1 focus:ring-gold/20";
    const label = "block text-warm-gray text-[0.6rem] uppercase tracking-[0.25em] mb-2";

    if (status === "sent") {
        return (
            <motion.div
                className="rounded-2xl border border-gold/20 bg-charcoal/40 p-10 text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <p className="font-serif text-2xl text-cream">Message sent</p>
                <p className="font-arabic text-gold/60 text-lg mt-2" dir="rtl">
                    تم الإرسال
                </p>
                <p className="text-cream-muted/80 text-sm font-light mt-5 leading-relaxed">
                    It has gone straight to Tasnim. She usually replies within a day.
                </p>
                <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="text-gold/70 hover:text-gold text-[0.65rem] uppercase tracking-[0.25em] mt-7 transition-colors"
                >
                    Send another
                </button>
            </motion.div>
        );
    }

    return (
        <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-gold/10 bg-charcoal/30 p-7 md:p-9"
        >
            {/* Hidden from people, inviting to bots — see the honeypot in the route. */}
            <div className="hidden" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
                <div>
                    <label className={label} htmlFor="name">
                        Your name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        maxLength={120}
                        autoComplete="name"
                        className={field}
                        placeholder="Name"
                    />
                </div>
                <div>
                    <label className={label} htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        maxLength={200}
                        autoComplete="email"
                        className={field}
                        placeholder="you@example.com"
                    />
                </div>
            </div>

            <div className="mt-5">
                <label className={label} htmlFor="subject">
                    What about?
                </label>
                <select id="subject" name="subject" className={field} defaultValue={SUBJECTS[0]}>
                    {SUBJECTS.map((s) => (
                        <option key={s} value={s} className="bg-midnight">
                            {s}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-5">
                <label className={label} htmlFor="message">
                    Message
                </label>
                <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    maxLength={4000}
                    className={`${field} resize-y min-h-[9rem]`}
                    placeholder="Tell her about the piece, the room, or the project — whatever is on your mind."
                />
            </div>

            {error && (
                <p className="text-red-300/90 text-sm font-light mt-5" role="alert">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={status === "sending"}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-midnight font-bold uppercase tracking-[0.15em] text-sm px-9 py-3.5 mt-7 transition-all hover:shadow-[0_0_40px_rgba(201,165,90,0.35)] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed"
            >
                {status === "sending" ? "Sending…" : "Send Message"}
            </button>

            <p className="text-warm-gray/50 text-xs mt-5 tracking-wide">
                Goes straight to Tasnim · Usually answered within a day
            </p>
        </form>
    );
}
