import type { Metadata } from "next";
import Navbar from "@/components/shared/Navbar";
import Gallery3DLoader from "@/components/gallery3d/Gallery3DLoader";

export const metadata: Metadata = {
    title: "3D Gallery — Tasnim Elyamani | Original Art & Portraits",
    description:
        "Step inside an immersive 3D gallery and walk through Tasnim Elyamani's original artwork and portraits.",
};

export default function Gallery3DPage() {
    return (
        <main>
            <Navbar />
            <Gallery3DLoader />
        </main>
    );
}
