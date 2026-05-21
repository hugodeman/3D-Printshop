export type PartColors = Record<string, string>
export type Vec3 = [number, number, number]
export type ScaleLimits = { min: number; max: number }

export type BuilderConfig = {
    createdAt?: string
    platformId: string
    platformColor: string
    platformSize: number
    platformName?: string
    totalItems?: number
    previewImage?: string

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