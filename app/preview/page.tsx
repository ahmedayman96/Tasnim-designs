import type { Metadata } from "next";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import PreviewClient from "@/components/room-preview/PreviewClient";

export const metadata: Metadata = {
    title: "See It In Your Room — Tasnim Elyamani | Original Art & Portraits",
    description:
        "Upload a photo of your room and preview Tasnim Elyamani's original artwork on your wall with AI.",
};

export default function PreviewPage() {
    return (
        <main className="min-h-screen bg-midnight">
            <Navbar />
            <PreviewClient />
            <Footer />
        </main>
    );
}
