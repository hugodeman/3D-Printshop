export type BuilderSceneDraftObject = {
	instanceId: string
	assetId: string
	position: [number, number, number]
	rotationY: number
	rotationZ:number
	scale: number
	scaleXY: number;
	scaleZ: number;
	color: string
	partColors?: Record<string, string>
	customGeometry?: {
		vertices: number[]
		indices?: number[]
		normals?: number[]
		uvs?: number[]
	}
	customName?: string
}

export type BuilderSceneDraft = {
	version: 1
	step: 1 | 2
	selectedPlatformId: string | null
	selectedPlatformColor: string
	selectedPlatformSize: 10 | 15 | 20
	placedObjects: BuilderSceneDraftObject[]
	selectedId: string | null
	nextId: number
	updatedAt: string
}

const BUILDER_SCENE_DRAFT_KEY = "builder-scene-draft"

function parseBuilderSceneDraft(rawDraft: string | null) {
	if (!rawDraft) return null

	try {
		return JSON.parse(rawDraft) as BuilderSceneDraft
	} catch {
		return null
	}
}

export function saveBuilderSceneDraft(draft: BuilderSceneDraft) {
	if (typeof window === "undefined") return
	window.localStorage.setItem(BUILDER_SCENE_DRAFT_KEY, JSON.stringify(draft))
}

export function readBuilderSceneDraft() {
	if (typeof window === "undefined") return null
	return parseBuilderSceneDraft(window.localStorage.getItem(BUILDER_SCENE_DRAFT_KEY))
}

export function clearBuilderSceneDraft() {
	if (typeof window === "undefined") return
	window.localStorage.removeItem(BUILDER_SCENE_DRAFT_KEY)
}


