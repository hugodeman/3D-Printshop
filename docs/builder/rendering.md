# Rendering Layer (Three.js)

## Doel

Renderen en interactie van de 3D scene.

---

## Kerncomponenten

### GLTFObject
- rendert 3D modellen
- ondersteunt tinting
- ondersteunt per-part coloring

### CustomObject
- image → OpenCV → contour → 3D extrude
- genereert BufferGeometry

---

## Interactie

### ClickHandler
- raycasting op meshes
- koppelt klik → instanceId

### OrbitControls
- camera navigatie

### MeasurementTool
- afstand meten tussen 2 punten

---

## Selection system

- selectedId bepaalt actieve objecten
- Outline effect via postprocessing