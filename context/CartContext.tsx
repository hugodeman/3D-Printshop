"use client"

import { createContext, useContext, useEffect, useState } from "react"

type CartItem = {
    id: string
    title: string
    price: number
    image: string
    option: string
    quantity: number
}

type CartContextType = {
    items: CartItem[]
    addItem: (item: Omit<CartItem, "quantity">) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    total: number
}

const CartContext = createContext<CartContextType | null>(null)

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

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id))
    }

    const updateQuantity = (id: string, quantity: number) => {
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, quantity } : i))
        )
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, total }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error("useCart must be used within CartProvider")
    return context
}