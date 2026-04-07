export type BuilderCheckoutDecorationDraft = {
	instanceId: string
	assetId: string
	name: string
	position: [number, number, number]
	rotationY: number
	scale: number
	color: string
}

export type BuilderCheckoutDraft = {
	platformId: string
	platformName: string
	decorations: BuilderCheckoutDecorationDraft[]
	totalItems: number
	createdAt: string
}

const BUILDER_CHECKOUT_DRAFT_KEY = "builder-checkout-draft"
const BUILDER_CHECKOUT_DRAFT_EVENT = "builder-checkout-draft:changed"

let cachedRawDraft: string | null = null
let cachedParsedDraft: BuilderCheckoutDraft | null = null

function parseDraft(rawDraft: string | null) {
	if (!rawDraft) {
		return null
	}

	try {
		return JSON.parse(rawDraft) as BuilderCheckoutDraft
	} catch {
		return null
	}
}

export function saveBuilderCheckoutDraft(draft: BuilderCheckoutDraft) {
	if (typeof window === "undefined") {
		return
	}

	const nextRawDraft = JSON.stringify(draft)
	window.sessionStorage.setItem(BUILDER_CHECKOUT_DRAFT_KEY, nextRawDraft)

	cachedRawDraft = nextRawDraft
	cachedParsedDraft = draft

	window.dispatchEvent(new CustomEvent(BUILDER_CHECKOUT_DRAFT_EVENT))
}

export function readBuilderCheckoutDraft() {
	if (typeof window === "undefined") {
		return null
	}

	const rawDraft = window.sessionStorage.getItem(BUILDER_CHECKOUT_DRAFT_KEY)
	if (rawDraft === cachedRawDraft) {
		return cachedParsedDraft
	}

	cachedRawDraft = rawDraft
	cachedParsedDraft = parseDraft(rawDraft)

	return cachedParsedDraft
}

export function subscribeBuilderCheckoutDraft(onStoreChange: () => void) {
	if (typeof window === "undefined") {
		return () => {}
	}

	const onStorage = (event: StorageEvent) => {
		if (event.key === BUILDER_CHECKOUT_DRAFT_KEY) {
			onStoreChange()
		}
	}

	const onCustomDraftChange = () => {
		onStoreChange()
	}

	window.addEventListener("storage", onStorage)
	window.addEventListener(BUILDER_CHECKOUT_DRAFT_EVENT, onCustomDraftChange)

	return () => {
		window.removeEventListener("storage", onStorage)
		window.removeEventListener(BUILDER_CHECKOUT_DRAFT_EVENT, onCustomDraftChange)
	}
}

