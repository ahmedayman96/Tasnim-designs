"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Artwork } from "@/lib/artworks";

interface CartItem {
    artwork: Artwork;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (artwork: Artwork) => void;
    removeFromCart: (slug: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("tasneem-cart");
            if (saved) {
                setItems(JSON.parse(saved));
            }
        } catch { }
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        localStorage.setItem("tasneem-cart", JSON.stringify(items));
    }, [items]);

    const addToCart = useCallback((artwork: Artwork) => {
        setItems((prev) => {
            const exists = prev.find((item) => item.artwork.slug === artwork.slug);
            if (exists) {
                // Art pieces are unique — don't allow duplicates
                return prev;
            }
            return [...prev, { artwork, quantity: 1 }];
        });
        setIsOpen(true);
    }, []);

    const removeFromCart = useCallback((slug: string) => {
        setItems((prev) => prev.filter((item) => item.artwork.slug !== slug));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const totalItems = items.length;
    const totalPrice = items.reduce((sum, item) => sum + item.artwork.price, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                clearCart,
                totalItems,
                totalPrice,
                isOpen,
                setIsOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
