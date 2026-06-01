# Checkout Flow

## Doel

De builder output correct omzetten naar een verkoopbaar item.

---

## Stap 1: Builder State (Zustand)

Live scene tijdens editing.

---

## Stap 2: Checkout Draft

Snapshot van builder state.

Wordt opgeslagen in localStorage.

### Bevat:
- platform info
- decorations
- preview image
- sizes
- timestamp

---

## Stap 3: Cart

- meerdere items mogelijk
- gebruikt voor checkout/payment

---

## Belangrijk verschil

| Draft | Cart |
|------|------|
| 1 builder sessie | winkelmand |
| snapshot | persistent commerce |

---

## Waarom draft bestaat

Omdat live Zustand state niet betrouwbaar is voor checkout:

- kan veranderen
- kan verdwijnen
- is UI-only