# Asset System (JSON-driven)

## Doel

Alle content in de builder komt uit een data-driven asset systeem.

Geen hardcoded modellen in UI.

---

## Types

### Platform

- base mesh
- bepaalt schaal en spawn point
- kleur instelbaar

### Decoration

- plaatsbare objecten
- kunnen schaal limits hebben
- kunnen partColors bevatten

---

## Voorbeeld

```json
{
  "id": "tree-model",
  "name": "Boom",
  "thumbnail": "/object-cards/Tree.png",
  "kind": "decoration",
  "modelPath": "/models/Tree.glb",
  "color": "#FFFFFF",
  "spawnPosition": [0, 0.2, 0],
  "scaleLimits": {
    "min": 0.7,
    "max": 2.2
  },
  "partColors": {
    "trunk": "#8B4513",
    "leaves": "#228B22"
  }
}
```

```json 
{
    "id": "square-model",
    "name": "Vierkant",
    "thumbnail": "/object-cards/Square.png",
    "dimensions": "10 x 10 x 1",
    "kind": "platform",
    "modelPath": "/models/Square.glb",
    "color": "#228B22",
    "spawnPosition": [0, 0, 0]
  }
```

---

## UI impact

### assets bepalen: 
- sidebar content
- sliders (scalelimits)
- color pickers (partColors)
- spawn points (spawnPosition)

---