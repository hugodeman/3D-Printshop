"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {Product} from "@/types/Product";
import {BuilderCheckoutDraft} from "@/lib/builder-checkout-draft";

/**
 * Item stored in the shopping cart.
 *
 * Supports:
 * * Regular webshop products
 * * Custom builder-generated products
 *
 * Builder items store serialized BuilderCheckoutDraft data
 * which is later converted into a BuilderItem during checkout.
 */

type CartItem = {
    id: string
    type: "product" | "builder"
    title: string
    price: number
    image: string
    quantity: number
    option?: string
    product?: Product
    builderData?: BuilderCheckoutDraft
}

type CartContextType = {
    items: CartItem[]
    addItem: (item: Omit<CartItem, "quantity">) => void
    removeItem: (id: string, option: string) => void
    clearCart: () => void
    updateQuantity: (id: string, option: string, quantity: number) => void
    total: number
    note: string
    setNote: (note: string) => void
}

const CartContext = createContext<CartContextType | null>(null)

/**
 * Global shopping cart state provider.
 *
 * Responsibilities:
 * * Persist cart state in localStorage
 * * Manage product + builder items
 * * Track checkout note
 * * Calculate total price
 * * Handle quantity updates
 *
 * Notes:
 * * Cart state is client-side only
 * * Orders are only created during checkout
 * * Builder items temporarily store BuilderCheckoutDraft data
 */

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        if (typeof window === "undefined") return []

        try {
            const stored = localStorage.getItem("cart")
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(items))
    }, [items])

    const addItem = (item: Omit<CartItem, "quantity">) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.id === item.id && i.option === item.option)
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id && i.option === item.option
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                )
            }
            return [...prev, { ...item, quantity: 1 }]
        })
    }

    const removeItem = (id: string, option: string) => {
        setItems((prev) => prev.filter((i) =>
                !(i.id === id && (i.option ?? "") === option)
        ))
    }

    const clearCart = () => {
        setItems([])
        setNote("")

        localStorage.removeItem("cart")
        localStorage.removeItem("cart-note")
    }

    const updateQuantity = (id: string, option: string, quantity: number) => {
        setItems((prev) =>
            prev.map((i) => (i.id === id && i.option === option ? { ...i, quantity } : i))
        )
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

    const [note, setNote] = useState(() => {
        if (typeof window === "undefined") return ""

        try {
            return localStorage.getItem("cart-note") ?? ""
        } catch {
            return ""
        }
    })

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, clearCart, updateQuantity, total, note, setNote }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error("useCart must be used within CartProvider")
    return context
}