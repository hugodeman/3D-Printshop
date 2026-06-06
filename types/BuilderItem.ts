import {BuilderConfig} from "@/types/BuilderConfig";

/**
 * Persisted custom builder creation stored per user.
 *
 * Contains:
 * - serialized scene configuration
 * - generated preview image
 * - optional printable export reference
 */

export type BuilderItem = {
    id: string
    imageUrl: string | null
    deliveryTime: number
    configJson: BuilderConfig
    painted: boolean
} | null
