import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import CartPanel from "@/components/cart/CartPanel";

export const metadata: Metadata = {
  title: "Tasnim Elyamani — تسنيم اليماني | Art, Architecture & Interiors",
  description:
    "Original art and architecture by Tasnim Elyamani — portraits, mixed media and resin work, alongside interior design, 2D construction drawings in AutoCAD and Revit, and 3ds Max visualisation.",
  keywords: [
    "art",
    "portraits",
    "mixed media",
    "collage",
    "resin art",
    "architecture",
    "interior design",
    "2D modelling",
    "3D modelling",
    "AutoCAD",
    "Revit",
    "3ds Max",
    "Tasnim Elyamani",
    "تسنيم اليماني",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700&family=Aref+Ruqaa:wght@400;700&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <CartProvider>
          {children}
          <CartPanel />
        </CartProvider>
      </body>
    </html>
  );
}
