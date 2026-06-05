import { it, expect, beforeEach, vi } from "vitest"
import { useBuilderStore } from "./builder-store"

vi.mock("@/app/builder/model-assets.json", () => ({
    default: [
        {
            id: "tree-model",
            kind: "decoration",
            color: "#FFFFFF",
            spawnPosition: [0, 0.2, 0],
            scaleLimits: {
                min: 0.7,
                max: 2.2,
            },
            partColors: {
                trunk: "#8B4513",
                leaves: "#228B22",
            },
        },
        {
            id: "square-model",
            name: "Vierkant",
            dimensions: "10 x 10 x 1",
            kind: "platform",
            color: "#228B22",
            spawnPosition: [0, 0, 0]
        },
    ],
}))

beforeEach(() => {
    useBuilderStore.setState({
        step: 1,
        selectedPlatformId: null,
        selectedPlatformColor: "#228B22",
        selectedPlatformSize: 10,
        placedObjects: [],
        selectedId: null,
        nextId: 0,
    })

    localStorage.clear()
    sessionStorage.clear()
})

it("past step juist aan", () => {
    useBuilderStore.getState().setStep(2)

    expect(useBuilderStore.getState().step).toBe(2)
})

it("selecteerd platform juist", () => {
    useBuilderStore
        .getState()
        .selectPlatform("platform-1", "#ff0000")

    const state = useBuilderStore.getState()

    expect(state.selectedPlatformId).toBe("platform-1")
    expect(state.selectedPlatformColor).toBe("#ff0000")
})

it("voegt juist een decoratie object toe", () => {
    useBuilderStore.getState().addObject("tree-model")

    const state = useBuilderStore.getState()

    expect(state.placedObjects.length).toBe(1)
    expect(state.selectedId).toBeTruthy()

    const obj = state.placedObjects[0]

    expect(obj.assetId).toBe("tree-model")
    expect(obj.position).toEqual([0, 0.2, 0])
    expect(obj.scale).toBe(1)
})

it("voegt geen fout model toe", () => {
    useBuilderStore.getState().addObject("invalid-id")

    const state = useBuilderStore.getState()

    expect(state.placedObjects.length).toBe(0)
})

it("telt goed nextId op bij toevoegen", () => {
    useBuilderStore.getState().addObject("tree-model")
    useBuilderStore.getState().addObject("tree-model")

    const state = useBuilderStore.getState()

    expect(state.placedObjects.length).toBe(2)
    expect(state.nextId).toBe(2)
})

it("toont partColors van model", () => {
    useBuilderStore.getState().addObject("tree-model")

    const obj = useBuilderStore.getState().placedObjects[0]

    expect(obj.partColors).toEqual({
        trunk: "#8B4513",
        leaves: "#228B22",
    })
})

it("past scale limiet aan van model", () => {
    useBuilderStore.getState().addObject("tree-model")

    const obj = useBuilderStore.getState().placedObjects[0]

    expect(obj.scale).toBeGreaterThanOrEqual(0.7)
    expect(obj.scale).toBeLessThanOrEqual(2.2)
})

it("updates geselecteerd object en clamps scale", () => {
    useBuilderStore.getState().addObject("tree-model")

    const id = useBuilderStore.getState().selectedId!

    useBuilderStore.getState().updateSelected((obj) => ({
        ...obj,
        scale: 999, // moet geclamped worden
    }))

    const updated = useBuilderStore
        .getState()
        .placedObjects.find(o => o.instanceId === id)

    expect(updated).toBeDefined()
    expect(updated!.scale).toBeLessThanOrEqual(2.2)
})


it("verwijdert geselecteerde object", () => {
    useBuilderStore.getState().addObject("some-asset-id")

    const id = useBuilderStore.getState().selectedId!

    useBuilderStore.getState().removeSelected()

    const state = useBuilderStore.getState()

    expect(state.placedObjects.find(o => o.instanceId === id)).toBeUndefined()
    expect(state.selectedId).toBeNull()
})

it("resets scene", () => {
    useBuilderStore.getState().addObject("some-asset-id")

    useBuilderStore.getState().resetScene()

    const state = useBuilderStore.getState()

    expect(state.placedObjects.length).toBe(0)
    expect(state.step).toBe(1)
})

it("doet niets bij updateSelected zonder geselecteerd object", () => {
    useBuilderStore.getState().addObject("tree-model")
    useBuilderStore.getState().setSelectedId(null)

    const before = useBuilderStore.getState().placedObjects

    useBuilderStore.getState().updateSelected((obj) => ({ ...obj, scale: 999 }))

    expect(useBuilderStore.getState().placedObjects).toEqual(before)
})

it("doet niets bij removeSelected zonder geselecteerd object", () => {
    useBuilderStore.getState().addObject("tree-model")
    useBuilderStore.getState().setSelectedId(null)

    useBuilderStore.getState().removeSelected()

    expect(useBuilderStore.getState().placedObjects.length).toBe(1)
})

it("setSelectedId werkt correct", () => {
    useBuilderStore.getState().addObject("tree-model")
    const id = useBuilderStore.getState().placedObjects[0].instanceId

    useBuilderStore.getState().setSelectedId(id)
    expect(useBuilderStore.getState().selectedId).toBe(id)

    useBuilderStore.getState().setSelectedId(null)
    expect(useBuilderStore.getState().selectedId).toBeNull()
})

it("setSelectedPlatformColor slaat kleur op", () => {
    useBuilderStore.getState().setSelectedPlatformColor("#FF0000")
    expect(useBuilderStore.getState().selectedPlatformColor).toBe("#FF0000")
})

it("setSelectedPlatformSize slaat grootte op", () => {
    useBuilderStore.getState().setSelectedPlatformSize(20)
    expect(useBuilderStore.getState().selectedPlatformSize).toBe(20)
})

it("voegt geen platform asset toe als decoration", () => {
    useBuilderStore.getState().addObject("platform")
    expect(useBuilderStore.getState().placedObjects.length).toBe(0)
})