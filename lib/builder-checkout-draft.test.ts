import { describe, it, expect, beforeEach } from "vitest"
import {
    saveBuilderCheckoutDraft,
    readBuilderCheckoutDraft,
    subscribeBuilderCheckoutDraft,
    BuilderCheckoutDraft,
} from "./builder-checkout-draft"

const mockDraft: BuilderCheckoutDraft = {
    platformId: "platform-grass",
    platformName: "Gras platform",
    platformSize: 10,
    platformColor: "#228B22",
    decorations: [],
    totalItems: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
}

const mockDraftMetDecoraties: BuilderCheckoutDraft = {
    ...mockDraft,
    decorations: [
        {
            instanceId: "tree-1",
            assetId: "tree-model",
            name: "Boom",
            position: [0, 0.2, 0],
            rotationY: 0,
            scale: 1,
            color: "#FFFFFF",
            partColors: { trunk: "#8B4513", leaves: "#228B22" },
        },
    ],
    totalItems: 1,
}

beforeEach(() => {
    sessionStorage.clear()
    // Cache resetten tussen tests — cache zit in module scope
    // door een lege save te doen en te clearen
    saveBuilderCheckoutDraft(mockDraft)
    sessionStorage.clear()
})

describe("saveBuilderCheckoutDraft", () => {
    it("slaat een draft op in sessionStorage", () => {
        saveBuilderCheckoutDraft(mockDraft)
        const raw = sessionStorage.getItem("builder-checkout-draft")
        expect(raw).not.toBeNull()
        expect(JSON.parse(raw!)).toEqual(mockDraft)
    })

    it("overschrijft een bestaande draft", () => {
        saveBuilderCheckoutDraft(mockDraft)
        saveBuilderCheckoutDraft({ ...mockDraft, platformColor: "#FF0000" })
        const result = readBuilderCheckoutDraft()
        expect(result?.platformColor).toBe("#FF0000")
    })

    it("vuurt een custom event na opslaan", () => {
        const handler = vi.fn()
        window.addEventListener("builder-checkout-draft:changed", handler)

        saveBuilderCheckoutDraft(mockDraft)

        expect(handler).toHaveBeenCalledOnce()
        window.removeEventListener("builder-checkout-draft:changed", handler)
    })
})

describe("readBuilderCheckoutDraft", () => {
    it("geeft null terug als er niets opgeslagen is", () => {
        expect(readBuilderCheckoutDraft()).toBeNull()
    })

    it("leest een opgeslagen draft correct terug", () => {
        saveBuilderCheckoutDraft(mockDraft)
        const result = readBuilderCheckoutDraft()
        expect(result).toEqual(mockDraft)
    })

    it("geeft null terug bij ongeldige JSON", () => {
        sessionStorage.setItem("builder-checkout-draft", "geen json {{{")
        // Cache omzeilen door mockDraft eerst te saven zodat cachedRawDraft verschilt
        const result = readBuilderCheckoutDraft()
        expect(result).toBeNull()
    })

    it("geeft gecachede versie terug bij ongewijzigde sessionStorage", () => {
        saveBuilderCheckoutDraft(mockDraft)

        const first = readBuilderCheckoutDraft()
        const second = readBuilderCheckoutDraft()

        // Zelfde object referentie — cache werkt
        expect(first).toBe(second)
    })

    it("leest decoraties correct terug", () => {
        saveBuilderCheckoutDraft(mockDraftMetDecoraties)
        const result = readBuilderCheckoutDraft()

        expect(result?.decorations).toHaveLength(1)
        expect(result?.decorations[0].instanceId).toBe("tree-1")
        expect(result?.decorations[0].partColors).toEqual({
            trunk: "#8B4513",
            leaves: "#228B22",
        })
    })
})

describe("subscribeBuilderCheckoutDraft", () => {
    it("roept callback aan bij custom event", () => {
        const callback = vi.fn()
        const unsubscribe = subscribeBuilderCheckoutDraft(callback)

        saveBuilderCheckoutDraft(mockDraft)

        expect(callback).toHaveBeenCalledOnce()
        unsubscribe()
    })

    it("roept callback aan bij storage event van ander tabblad", () => {
        const callback = vi.fn()
        const unsubscribe = subscribeBuilderCheckoutDraft(callback)

        window.dispatchEvent(new StorageEvent("storage", {
            key: "builder-checkout-draft",
            newValue: JSON.stringify(mockDraft),
        }))

        expect(callback).toHaveBeenCalledOnce()
        unsubscribe()
    })

    it("reageert niet op storage events van andere keys", () => {
        const callback = vi.fn()
        const unsubscribe = subscribeBuilderCheckoutDraft(callback)

        window.dispatchEvent(new StorageEvent("storage", {
            key: "andere-key",
            newValue: "iets",
        }))

        expect(callback).not.toHaveBeenCalled()
        unsubscribe()
    })

    it("unsubscribe verwijdert de listeners", () => {
        const callback = vi.fn()
        const unsubscribe = subscribeBuilderCheckoutDraft(callback)

        unsubscribe()
        saveBuilderCheckoutDraft(mockDraft)

        expect(callback).not.toHaveBeenCalled()
    })
})