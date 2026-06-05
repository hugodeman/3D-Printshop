"use client"

import { create } from "zustand"
import * as THREE from "three"

import { clearBuilderSceneDraft, readBuilderSceneDraft, saveBuilderSceneDraft } from "@/lib/builder-scene-draft"
import rawModelAssets from "@/app/builder/model-assets.json"

import {getAssetScaleLimits, normalizeHexColor, clamp} from "@/lib/builder-scene-utils";
import {PartColors, Vec3, ModelAsset} from "@/types/BuilderConfig";

/**
 * Builder state architecture
 *
 * Zustand Store
 *   ↕
 * BuilderSceneDraft (localStorage autosave)
 *   ↓
 * BuilderCheckoutDraft (overview snapshot)
 *   ↓
 * Shopping Cart
 *   ↓
 * Order creation
 *   ↓
 * Print file generation
 *
 * The store is the source of truth while editing.
 */

export type BuilderStep = 1 | 2

export type PlacedObject = {
	instanceId: string
	assetId: string
	position: Vec3
	rotationY: number
	rotationZ: number
	scale: number
	scaleXY: number
	scaleZ: number
	color: string
	partColors?: PartColors
	customGeometry?: {
		vertices: number[]
		indices?: number[]
		normals?: number[]
		uvs?: number[]
	}
	customName?: string
}

type InitialBuilderState = {
	step: BuilderStep
	selectedPlatformId: string | null
	selectedPlatformColor: string
	selectedPlatformSize: 10 | 15 | 20
	placedObjects: PlacedObject[]
	selectedId: string | null
	nextId: number
	isAddCustomObjectModalOpen: boolean
}

type BuilderStore = InitialBuilderState & {
	setStep: (step: BuilderStep) => void
	selectPlatform: (platformId: string, platformColor: string) => void
	setSelectedPlatformColor: (color: string) => void
	setSelectedPlatformSize: (size: 10 | 15 | 20) => void
	addObject: (assetId: string) => void
	addCustomObject: (geometry: THREE.BufferGeometry, name: string, color?: string) => void
	openAddCustomObjectModal: () => void
	closeAddCustomObjectModal: () => void
	updateSelected: (updater: (o: PlacedObject) => PlacedObject) => void
	removeSelected: () => void
	setSelectedId: (id: string | null) => void
	resetScene: () => void
}

const DEFAULT_PLATFORM_COLOR = "#228B22"
const ROTATION_MIN = 0
const ROTATION_MAX = 2 * Math.PI
// as unknown for unmatching model types
const modelAssets = rawModelAssets as unknown as ModelAsset[]
const modelAssetsById = new Map(modelAssets.map((asset) => [asset.id, asset]))

function createDefaultBuilderState(): InitialBuilderState {
	return {
		step: 1,
		selectedPlatformId: null,
		selectedPlatformColor: DEFAULT_PLATFORM_COLOR,
		selectedPlatformSize: 10,
		placedObjects: [],
		selectedId: null,
		nextId: 0,
		isAddCustomObjectModalOpen: false
	}
}

/**
 * Restores the builder from a previously saved draft.
 *
 * All persisted values are validated and sanitized before being
 * loaded into the Zustand store.
 *
 * Invalid:
 * - asset ids
 * - colors
 * - scales
 * - rotations
 * - selections
 *
 * are automatically replaced with safe defaults.
 *
 * This prevents corrupted localStorage data from breaking the builder.
 */

function buildInitialBuilderState(): InitialBuilderState {
	const fallback = createDefaultBuilderState()

	const draft = readBuilderSceneDraft()
	if (!draft || draft.version !== 1) return fallback

	const validPlatformId = draft.selectedPlatformId && modelAssetsById.has(draft.selectedPlatformId)
	const selectedPlatformId = validPlatformId ? draft.selectedPlatformId : null
	const selectedPlatformColor = normalizeHexColor(draft.selectedPlatformColor) ?? DEFAULT_PLATFORM_COLOR
	const selectedPlatformSize = draft.selectedPlatformSize === 15 || draft.selectedPlatformSize === 20 ? draft.selectedPlatformSize : 10

	const placedObjects = (draft.placedObjects ?? [])
		.filter((obj) => modelAssetsById.has(obj.assetId) || obj.assetId === "custom-object")
		.map((obj) => {
			const asset = modelAssetsById.get(obj.assetId) ?? null
			const limits = getAssetScaleLimits(asset)
			const color = normalizeHexColor(obj.color) ?? (normalizeHexColor(asset?.color ?? "") ?? "#FFFFFF")
			const partColors = obj.partColors
				? Object.fromEntries(
						Object.entries(obj.partColors)
							.map(([partName, partColor]) => [partName, normalizeHexColor(partColor)])
							.filter((entry): entry is [string, string] => Boolean(entry[1])),
					)
				: undefined

			return {
				instanceId: obj.instanceId,
				assetId: obj.assetId,
				position: [
					Number.isFinite(obj.position?.[0]) ? obj.position[0] : 0,
					Number.isFinite(obj.position?.[1]) ? obj.position[1] : 0,
					Number.isFinite(obj.position?.[2]) ? obj.position[2] : 0,
				] as Vec3,
				rotationY: clamp(Number(obj.rotationY) || 0, ROTATION_MIN, ROTATION_MAX),
				rotationZ: clamp(Number(obj.rotationZ) || 0, ROTATION_MIN, ROTATION_MAX),
				scale: clamp(Number(obj.scale) || 1, limits.min, limits.max),
				scaleXY: clamp(Number(obj.scaleXY) || 1, limits.min, limits.max),
				scaleZ: clamp(Number(obj.scaleZ) || 1, limits.min, limits.max),
				color,
				partColors,
				customGeometry: obj.customGeometry,
				customName: obj.customName,
			}
		})

	const selectedId = placedObjects.some((obj) => obj.instanceId === draft.selectedId)
		? draft.selectedId
		: null

	const computedNextId = placedObjects.reduce((maxId, obj) => {
		const suffix = Number(obj.instanceId.split("-").pop())
		return Number.isFinite(suffix) ? Math.max(maxId, suffix) : maxId
	}, 0)

	/**
	 * Incrementing counter used to generate unique instance ids.
	 *
	 * Example:
	 * tree-1
	 * tree-2
	 * tree-3
	 */

	const nextId = Number.isFinite(draft.nextId)
		? Math.max(Number(draft.nextId), computedNextId)
		: computedNextId

	return {
		step: draft.step === 2 && selectedPlatformId ? 2 : 1,
		selectedPlatformId,
		selectedPlatformColor,
		selectedPlatformSize,
		placedObjects,
		selectedId,
		nextId,
		isAddCustomObjectModalOpen: false
	}
}

const initialState = buildInitialBuilderState()

/**
 * Persists the complete builder state to localStorage.
 *
 * Called after every state mutation so the user can safely
 * refresh the page or continue editing later.
 */

function persistScene(state: BuilderStore) {
	saveBuilderSceneDraft({
		version: 1,
		step: state.step,
		selectedPlatformId: state.selectedPlatformId,
		selectedPlatformColor: state.selectedPlatformColor,
		selectedPlatformSize: state.selectedPlatformSize,
		placedObjects: state.placedObjects,
		selectedId: state.selectedId,
		nextId: state.nextId,
		updatedAt: new Date().toISOString(),
	})
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
	...initialState,
	setStep: (step) => {
		set({ step })
		persistScene(get())
	},
	selectPlatform: (platformId, platformColor) => {
		set({ selectedPlatformId: platformId, selectedPlatformColor: platformColor })
		persistScene(get())
	},
	setSelectedPlatformColor: (color) => {
		set({ selectedPlatformColor: color })
		persistScene(get())
	},
	setSelectedPlatformSize: (size) => {
		set({ selectedPlatformSize: size })
		persistScene(get())
	},
	addObject: (assetId) => {
		const asset = modelAssetsById.get(assetId)
		if (!asset || asset.kind !== "decoration") return

		set((state) => {
			const nextId = state.nextId + 1
			const limits = getAssetScaleLimits(asset)
			const instanceId = `${asset.id}-${nextId}`
			const rawSpawn = asset.spawnPosition ?? []
			const spawnPosition: Vec3 = [
				Number.isFinite(rawSpawn[0]) ? Number(rawSpawn[0]) : 0,
				Number.isFinite(rawSpawn[1]) ? Number(rawSpawn[1]) : 0,
				Number.isFinite(rawSpawn[2]) ? Number(rawSpawn[2]) : 0,
			]

			return {
				nextId,
				selectedId: instanceId,
				placedObjects: [
					...state.placedObjects,
					{
						instanceId,
						assetId: asset.id,
						position: spawnPosition,
						rotationY: 0,
						rotationZ: 0,
						scale: clamp(1, limits.min, limits.max),
						scaleXY: clamp(1, limits.min, limits.max),
						scaleZ: clamp(1, limits.min, limits.max),
						color: asset.color,
						partColors: asset.partColors,
					},
				],
			}
		})
		persistScene(get())
	},

	/**
	 * Adds a custom user-generated geometry to the scene.
	 *
	 * The geometry is converted into serializable arrays so it can be
	 * stored in localStorage and restored later.
	 *
	 * Three.js BufferGeometry instances themselves cannot be persisted.
	 */

	addCustomObject: (geometry, name, color) => {
		set((state) => {
			const nextId = state.nextId + 1
			const instanceId = `custom-${nextId}`

			// Extract geometry data for serialization
			const positionAttribute = geometry.getAttribute("position")
			const normalAttribute = geometry.getAttribute("normal")
			const uvAttribute = geometry.getAttribute("uv")
			const indexAttribute = geometry.getIndex()

			const customGeometry = {
				vertices: Array.from(positionAttribute.array),
				indices: indexAttribute ? Array.from(indexAttribute.array) : undefined,
				normals: normalAttribute ? Array.from(normalAttribute.array) : undefined,
				uvs: uvAttribute ? Array.from(uvAttribute.array) : undefined,
			}

			return {
				nextId,
				selectedId: instanceId,
				isAddCustomObjectModalOpen: false,
				placedObjects: [
					...state.placedObjects,
					{
						instanceId,
						assetId: "custom-object", // Special asset ID for custom objects
						position: [0, 0.5, 0], // Higher position for custom objects
						rotationY: 0,
						rotationZ: 0,
						scale: 1,
						scaleXY: 1,
						scaleZ:1,
						color: color || "#FFFFFF",
						customGeometry,
						customName: name,
					},
				],
			}
		})
		persistScene(get())
	},

	openAddCustomObjectModal: () => {
		set({ isAddCustomObjectModalOpen: true })
	},

	closeAddCustomObjectModal: () => {
		set({ isAddCustomObjectModalOpen: false })
	},

	/**
	 * Updates the currently selected object.
	 *
	 * The updater receives the current object and must return
	 * the modified version.
	 *
	 * Scale values are automatically clamped to the limits
	 * defined by the asset configuration.
	 */

	updateSelected: (updater) => {
		set((state) => {
			if (!state.selectedId) return {}

			const placedObjects = state.placedObjects.map((obj) => {
				if (obj.instanceId !== state.selectedId) return obj
				const next = updater(obj)
				const limits = getAssetScaleLimits(modelAssetsById.get(next.assetId) ?? null)
				return {
					...next,
					scale: clamp(next.scale, limits.min, limits.max),
					scaleXY: clamp(next.scaleXY, limits.min, limits.max),
					scaleZ: clamp(next.scaleZ, limits.min, limits.max),
				}
			})

			return { placedObjects }
		})
		persistScene(get())
	},
	removeSelected: () => {
		set((state) => {
			if (!state.selectedId) return {}
			return {
				placedObjects: state.placedObjects.filter((obj) => obj.instanceId !== state.selectedId),
				selectedId: null,
			}
		})
		persistScene(get())
	},
	setSelectedId: (id) => {
		set({ selectedId: id })
		persistScene(get())
	},
	resetScene: () => {
		clearBuilderSceneDraft()
		set(createDefaultBuilderState())
	},
}))

