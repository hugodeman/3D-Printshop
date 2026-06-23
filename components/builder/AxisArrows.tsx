import * as THREE from "three"
import {useMemo} from "react";

const PLATFORM_HALF: Record<string, { x: number; z: number }> = {
    10:  { x: 2.0, z: 2.0 },
    15: { x: 3.0, z: 3.0 },
    20:  { x: 4.0, z: 4.0 },
}

/** Hoe ver de pijlpunt buiten de platformrand uitsteekt */
const OVERHANG = 0.5
/** Hoogte boven het platform waarop de pijlen zweven */
const ARROW_Y  = 0.05

interface Props {
    platformSize: number
    platformCenter?: [number, number, number]
}

export function AxisArrows({ platformSize, platformCenter = [0,0,0] }: Props) {
    const half = PLATFORM_HALF[platformSize] ?? PLATFORM_HALF.medium

    const xLen = half.x + OVERHANG   // totale pijllengte langs X
    const zLen = half.z + OVERHANG   // totale pijllengte langs Z

    const [cx, cy, cz] = platformCenter

    return (
        <group position={[cx, cy + ARROW_Y, cz]}>
            {/* ── X-as: rood, richting +X ── */}
            <AxisArrow
                length={xLen}
                color="#E24B4A"
                rotation={[0, 0, -Math.PI / 2]}  // ArrowHelper wijst standaard omhoog (+Y)
                label="X"
            />
            {/* ── Z-as: blauw, richting +Z ── */}
            <AxisArrow
                length={zLen}
                color="#378ADD"
                rotation={[Math.PI / 2, 0, 0]}   // draai naar +Z richting
                label="Z"
            />
        </group>
    )
}

/* ─── Herbruikbare enkele pijl ─────────────────────────────────── */
function AxisArrow({length, color, rotation, label}: {
    length: number; color: string
    rotation: [number, number, number]; label: string
}) {
    const shaftLen  = length * 0.82
    const headLen   = length * 0.18
    const shaftR    = 0.025
    const headR     = 0.06

    // Shaft middelpunt zit op length/2, head daarna
    const shaftY    = shaftLen / 2
    const headY     = shaftLen + headLen / 2

    return (
        // rotation draait de hele groep zodat +Y de gewenste asrichting wordt
        <group rotation={rotation}>
            {/* Schacht */}
            <mesh position={[0, shaftY, 0]}>
                <cylinderGeometry args={[shaftR, shaftR, shaftLen, 12]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Pijlpunt (cone) */}
            <mesh position={[0, headY, 0]}>
                <coneGeometry args={[headR, headLen, 16]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Tekst-label aan het uiteinde */}
            <LabelSprite text={label} color={color} y={shaftLen + headLen + 0.15} />
        </group>
    )
}

/* ─── Canvas-texture sprite voor het label ─────────────────────── */
function LabelSprite({ text, color, y }: { text: string; color: string; y: number }) {
    const tex = useMemo(() => {
        const canvas = document.createElement("canvas")
        canvas.width = 64; canvas.height = 64
        const ctx = canvas.getContext("2d")!
        ctx.fillStyle = color
        ctx.font = "bold 42px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(text, 32, 32)
        return new THREE.CanvasTexture(canvas)
    }, [text, color])

    return (
        <sprite position={[0, y, 0]} scale={[0.35, 0.35, 1]}>
            <spriteMaterial map={tex} depthTest={false} />
        </sprite>
    )
}