/**
 * partColors
 *
 * Maps mesh/material identifiers to user-selected colors.
 *
 * Used for multipart printable assets where
 * individual sections can be recolored independently.
 *
 * Vec3
 *
 * Position in scene space [x, y, z]
 *
 * Scalelimits
 *
 * Defines the allowed scale range for a decoration asset.
 */
export type PartColors = Record<string, string>
export type Vec3 = [number, number, number]
export type ScaleLimits = { min: number; max: number }

/**
 * Serialized configuration of a custom figurine stand.
 *
 * This object contains all data required to:
 * - reconstruct the Three.js scene
 * - restore builder state
 * - generate previews
 * - export printable files
 * - persist custom creations in the database
 */

export type BuilderConfig = {
    createdAt?: string
    platformId: string
    platformColor: string
    platformSize: number
    platformName?: string
    totalItems?: number
    previewImage?: string

    /**
     * Individual placed decoration instance.
     *
     * Multiple instances can reference the same assetId,
     * therefore each placed object receives a unique instanceId.
     */

    decorations: Array<{
        instanceId: string
        assetId: string
        position: Vec3
        rotationY: number
        scale: number
        color: string
        partColors?: PartColors
    }>
}

/**
 * Static metadata describing a builder asset.
 *
 * Assets are predefined models that can be placed
 * inside the figurine stand builder scene.
 */
export type ModelAsset = {
    dimensions: string;
    id: string
    name: string
    thumbnail: string
    kind: "platform" | "decoration"
    modelPath: string
    color: string
    partColors?: PartColors
    spawnPosition?: Vec3
    scaleLimits?: ScaleLimits
}