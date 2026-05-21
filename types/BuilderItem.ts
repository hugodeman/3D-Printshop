import {BuilderConfig} from "@/types/BuilderConfig";

export type BuilderItem = {
    id: string
    imageUrl: string | null
    deliveryTime: number
    configJson: BuilderConfig
} | null
