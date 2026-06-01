/**
 * Frontend-safe product model.
 *
 * Prisma Decimal values are converted to native numbers
 * before being passed into React components.
 */

export type Product = {
    id: string
    title: string
    price: number
    description: string
    deliveryTime: number | null
    filament: string | null
    dimensions: string | null
    type: string
    images: {
        id: string
        url: string
        productId: string
    }[]
    options: {
        paintable: boolean | null
        color: string | null
    } | null
}