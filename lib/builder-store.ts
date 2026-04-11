"use client"

import { create } from "zustand"

import { readBuilderSceneDraft, saveBuilderSceneDraft } from "@/lib/builder-scene-draft"
import rawModelAssets from "@/app/builder/model-assets.json"

type PartColors = Record<string, string>
type Vec3 = [number, number, number]
type ScaleLimits = { min: number; max: number }

type ModelAsset = {
	id: string
	kind: "platform" | "decoration"
	color: string
	spawnPosition?: number[]
	scaleLimits?: ScaleLimits
	partColors?: PartColors
}

export type BuilderStep = 1 | 2

export type PlacedObject = {
	instanceId: string
	assetId: string
	position: Vec3
	rotationY: number
	scale: number
	color: string
	partColors?: PartColors
}

type InitialBuilderState = {
	step: BuilderStep
	selectedPlatformId: string | null
	selectedPlatformColor: string
	selectedPlatformSize: 10 | 15 | 20
	placedObjects: PlacedObject[]
	selectedId: string | null
	nextId: number
}

type BuilderStore = InitialBuilderState & {
	setStep: (step: BuilderStep) => void
	selectPlatform: (platformId: string, platformColor: string) => void
	setSelectedPlatformColor: (color: string) => void
	setSelectedPlatformSize: (size: 10 | 15 | 20) => void
	addObject: (assetId: string) => void
	updateSelected: (updater: (obj: PlacedObject) => PlacedObject) => void
	removeSelected: () => void
	setSelectedId: (id: string | null) => void
}

const DEFAULT_PLATFORM_COLOR = "#228B22"
const ROTATION_MIN = 0
const ROTATION_MAX = 2 * Math.PI
const SCALE_MIN = 0.5
const SCALE_MAX = 3
// as unknown for unmatching model types
const modelAssets = rawModelAssets as unknown as ModelAsset[]
const modelAssetsById = new Map(modelAssets.map((asset) => [asset.id, asset]))

// Keeps values between a range
function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max)
}

// Ensures the color is in #RRGGBB format for inputs
function normalizeHexColor(value: string) {
	const withHash = value.startsWith("#") ? value : `#${value}`
	const isHex = /^#[0-9a-fA-F]{6}$/.test(withHash)
	return isHex ? withHash.toUpperCase() : null
}

function getAssetScaleLimits(asset: ModelAsset | null | undefined): ScaleLimits {
	const min = asset?.scaleLimits?.min ?? SCALE_MIN
	const max = asset?.scaleLimits?.max ?? SCALE_MAX
	return { min: Math.min(min, max), max: Math.max(min, max) }
}

// Read and sanitize stored draft so invalid data cannot break the builder.
function buildInitialBuilderState(): InitialBuilderState {
	const fallback: InitialBuilderState = {
		step: 1,
		selectedPlatformId: null,
		selectedPlatformColor: DEFAULT_PLATFORM_COLOR,
		selectedPlatformSize: 10,
		placedObjects: [],
		selectedId: null,
		nextId: 0,
	}

	const draft = readBuilderSceneDraft()
	if (!draft || draft.version !== 1) return fallback

	const validPlatformId = draft.selectedPlatformId && modelAssetsById.has(draft.selectedPlatformId)
	const selectedPlatformId = validPlatformId ? draft.selectedPlatformId : null
	const selectedPlatformColor = normalizeHexColor(draft.selectedPlatformColor) ?? DEFAULT_PLATFORM_COLOR
	const selectedPlatformSize = draft.selectedPlatformSize === 15 || draft.selectedPlatformSize === 20 ? draft.selectedPlatformSize : 10

	const placedObjects = (draft.placedObjects ?? [])
		.filter((obj) => modelAssetsById.has(obj.assetId))
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
				scale: clamp(Number(obj.scale) || 1, limits.min, limits.max),
				color,
				partColors,
			}
		})

	const selectedId = placedObjects.some((obj) => obj.instanceId === draft.selectedId)
		? draft.selectedId
		: null

	const computedNextId = placedObjects.reduce((maxId, obj) => {
		const suffix = Number(obj.instanceId.split("-").pop())
		return Number.isFinite(suffix) ? Math.max(maxId, suffix) : maxId
	}, 0)

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
	}
}

const initialState = buildInitialBuilderState()

// Persists the current builder state to localStorage as a draft. This is called on every state change to ensure the draft is always up-to-date.
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
						scale: clamp(1, limits.min, limits.max),
						color: asset.color,
						partColors: asset.partColors,
					},
				],
			}
		})
		persistScene(get())
	},
	updateSelected: (updater) => {
		set((state) => {
			if (!state.selectedId) return {}

			const placedObjects = state.placedObjects.map((obj) => {
				if (obj.instanceId !== state.selectedId) return obj
				const next = updater(obj)
				const limits = getAssetScaleLimits(modelAssetsById.get(next.assetId) ?? null)
				return { ...next, scale: clamp(next.scale, limits.min, limits.max) }
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
}))



