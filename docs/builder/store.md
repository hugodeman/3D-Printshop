# Builder Store (Zustand)

## Doel

De store beheert alle live editor state tijdens het bouwen.

Deze state is **volatiel** en bedoeld voor real-time interactie.

---

## State

### Platform
- selectedPlatformId
- selectedPlatformColor
- selectedPlatformSize

### Scene
- placedObjects
- selectedId
- step

---

## Actions

- selectPlatform(id)
- addObject(assetId)
- addCustomObject(geometry)
- updateSelected(fn)
- removeSelected()
- resetScene()

---

## Belangrijk principe

> De store is geen opslag, maar een runtime editor state.