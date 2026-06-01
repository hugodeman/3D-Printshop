import {Color, Material, type Mesh, type Object3D} from "three";
import {ModelAsset, PartColors, ScaleLimits} from "@/types/BuilderConfig";

const SCALE_MIN = 0.5
const SCALE_MAX = 3
const DEG_PER_RAD = 180 / Math.PI

export function tintMaterial(material: Material, color: string) {
    const clone = material.clone() as Material & { color?: Color }
    if (clone.color) clone.color.set(color)
    return clone
}

/**
 * Applies color overrides to every mesh in a model hierarchy.
 *
 * Supports:
 * - single model color
 * - per-part color overrides
 *
 * Materials are cloned before tinting to prevent shared
 * GLTF materials from affecting other instances.
 */

export function applyModelTint(root: Object3D, defaultColor: string, partColors?: PartColors) {
    root.traverse((node) => {
        const mesh = node as Mesh
        if (!mesh.isMesh || !mesh.material) return

        const color = partColors?.[node.name] ?? defaultColor
        if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => tintMaterial(m, color))
        } else {
            mesh.material = tintMaterial(mesh.material, color)
        }
    })
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

/**
 * Validates and normalizes a hexadecimal color string.
 *
 * Returns an uppercase hex value including '#',
 * or null if the input is invalid.
 */

export function normalizeHexColor(value: string) {
    const withHash = value.startsWith("#") ? value : `#${value}`
    const isHex = /^#[0-9a-fA-F]{6}$/.test(withHash)
    return isHex ? withHash.toUpperCase() : null
}

export function getAssetScaleLimits(asset: ModelAsset | null | undefined): ScaleLimits {
    const min = asset?.scaleLimits?.min ?? SCALE_MIN
    const max = asset?.scaleLimits?.max ?? SCALE_MAX
    return { min: Math.min(min, max), max: Math.max(min, max) }
}

export function radiansToDegrees(rad: number) {
    return Math.round(rad * DEG_PER_RAD)
}

export function degreesToRadians(deg: number) {
    return deg / DEG_PER_RAD
}