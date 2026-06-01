# Builder Architecture (Overview)

De builder is een 3D configurator waarin gebruikers een platform kiezen, decoraties plaatsen en hun scene aanpassen in real-time.

De architectuur bestaat uit 4 lagen:

1. Runtime Scene (Zustand)
2. Asset Layer (JSON-driven content)
3. Rendering Layer (Three.js)
4. Persistence Layer (Draft + Cart)

---

## Kernprincipe

> De builder is stateless in de UI, state-driven in de store, en snapshot-based voor checkout.

---

## Data Flow

Asset JSON → Builder UI → Zustand Store → Checkout Draft → Cart → Payment