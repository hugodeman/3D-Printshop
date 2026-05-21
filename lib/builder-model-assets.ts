import rawModelAssets from "@/app/builder/model-assets.json"
import { ModelAsset } from "@/types/BuilderConfig"

export const modelAssets =
    rawModelAssets as unknown as ModelAsset[]

export const platformAssets =
    modelAssets.filter((a) => a.kind === "platform")

export const decorationAssets =
    modelAssets.filter((a) => a.kind === "decoration")

export const assetsById =
    new Map(modelAssets.map((a) => [a.id, a]))