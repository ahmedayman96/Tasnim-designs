import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
    try {
        const { items } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "No items provided" },
                { status: 400 }
            );
        }

        // Create line items for Stripe
        const lineItems = items.map((item: { title: string; price: number; image: string }) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.title,
                    images: item.image ? [`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}${item.image}`] : [],
                    description: "Original artwork by Tasnim Elyamani",
                },
                unit_amount: Math.round(item.price * 100), // Stripe uses cents
            },
            quantity: 1,
        }));

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/checkout/cancel`,
            shipping_address_collection: {
                allowed_countries: ["AE", "SA", "US", "GB", "DE", "FR", "CA", "AU", "KW", "QA", "BH", "OM"],
            },
            billing_address_collection: "required",
            metadata: {
                items: JSON.stringify(items.map((i: { title: string }) => i.title)),
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
