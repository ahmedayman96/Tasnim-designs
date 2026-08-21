import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getArtworkBySlug } from "@/lib/artworks";

export async function POST(request: Request) {
    try {
        const { items } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "No items provided" },
                { status: 400 }
            );
        }

        // Resolve every item against the catalogue on the server. Title, price and
        // image are taken from here and never from the request body — the client is
        // free to claim any price it likes, and Stripe would honour it.
        const resolved = items.map((item: { slug?: string }) =>
            item?.slug ? getArtworkBySlug(item.slug) : undefined
        );

        if (resolved.some((artwork) => !artwork)) {
            return NextResponse.json(
                { error: "Unknown artwork in cart" },
                { status: 400 }
            );
        }

        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

        const lineItems = resolved.map((artwork) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: artwork!.title,
                    images: artwork!.image ? [`${baseUrl}${artwork!.image}`] : [],
                    description: "Original artwork by Tasnim Elyamani",
                },
                unit_amount: Math.round(artwork!.price * 100), // Stripe uses cents
            },
            quantity: 1,
        }));

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/checkout/cancel`,
            shipping_address_collection: {
                allowed_countries: ["AE", "SA", "US", "GB", "DE", "FR", "CA", "AU", "KW", "QA", "BH", "OM"],
            },
            billing_address_collection: "required",
            metadata: {
                items: JSON.stringify(resolved.map((artwork) => artwork!.title)),
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Stripe checkout error:", error);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
