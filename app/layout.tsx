import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import CartPanel from "@/components/cart/CartPanel";

export const metadata: Metadata = {
  title: "Tasnim Elyamani — تسنيم اليماني | Original Art & Portraits",
  description:
    "Discover handcrafted artwork by Tasnim Elyamani. Original portraits, mixed media collages, and paintings that capture emotion and beauty.",
  keywords: ["art", "portraits", "mixed media", "collage", "Tasnim Elyamani", "تسنيم اليماني"],
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
