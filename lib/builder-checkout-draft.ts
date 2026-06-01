/**
 * Builder checkout draft persistence.
 *
 * Stores the current builder configuration in sessionStorage
 * so it can be transferred from the builder to the checkout flow.
 *
 * The draft acts as a snapshot of the builder state and contains:
 * - selected platform
 * - platform size and color
 * - placed decorations
 * - preview image
 * - metadata required for order creation
 *
 * Data is persisted in sessionStorage and synchronized through
 * custom browser events.
 */

export type BuilderCheckoutDecorationDraft = {
	instanceId: string
	assetId: string
	name: string
	position: [number, number, number]
	rotationY: number
	scale: number
	color: string
	partColors?: Record<string, string>
}

export type BuilderCheckoutDraft = {
	platformId: string
	platformName: string
	platformSize: 10 | 15 | 20
	platformColor: string
	decorations: BuilderCheckoutDecorationDraft[]
	totalItems: number
	createdAt: string
	previewImage?: string
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

/**
 * Saves a builder checkout draft to sessionStorage.
 *
 * Also updates the in-memory cache and dispatches a custom
 * browser event so subscribed components can react immediately.
 */

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

/**
 * Retrieves the current builder checkout draft.
 *
 * Uses an in-memory cache to avoid unnecessary JSON parsing
 * when the stored draft has not changed.
 */

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

/**
 * Subscribes to checkout draft changes.
 *
 * Listens for:
 * - browser storage events
 * - custom builder draft update events
 *
 * Returns an unsubscribe callback.
 */

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

