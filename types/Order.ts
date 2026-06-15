import {Product} from "@/types/Product";
import {BuilderItem} from "@/types/BuilderItem";

export type Order = {
    id: string
    status: string
    total: string
    note: string | null
    createdAt: string
    firstName: string | null
    lastName: string | null
    email: string | null
    items: Array<{
        id: string
        quantity: number
        price: number
        option: string | null
        product: Product
        builderItem: BuilderItem
    }>
}