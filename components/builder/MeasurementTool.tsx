"use client"

import { useEffect, useRef, useState } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { Line } from "@react-three/drei"
import { P } from "@/components/ui/Typography"

interface MeasurementToolProps {
  enabled: boolean
  onMeasure?: (distance: number) => void
}

export function MeasurementTool({ enabled, onMeasure }: MeasurementToolProps) {
  const { camera, gl, scene } = useThree()
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([])
  const [linePoints, setLinePoints] = useState<THREE.Vector3[]>([])
  const [distance, setDistance] = useState<number | null>(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const CLICK_MOVE_THRESHOLD = 5

  useEffect(() => {
    if (!enabled) return

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      pointerStart.current = { x: e.clientX, y: e.clientY }
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (!pointerStart.current) return

      const dx = e.clientX - pointerStart.current.x
      const dy = e.clientY - pointerStart.current.y
      const moved = Math.sqrt(dx * dx + dy * dy)
      pointerStart.current = null

      // Dragging → niet meten
      if (moved > CLICK_MOVE_THRESHOLD) return
      if (!e.shiftKey) {
        // Gewone klik zonder shift → reset meting
        setMeasurePoints([])
        setLinePoints([])
        setDistance(null)
        onMeasure?.(0)
        return
      }

      const canvas = gl.domElement
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)

      const allObjects: THREE.Object3D[] = []
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) allObjects.push(obj)
      })

      const intersects = raycasterRef.current.intersectObjects(allObjects, true)
      if (intersects.length === 0) return

      const point = intersects[0].point.clone()

      setMeasurePoints((prev) => {
        if (prev.length === 0) {
          return [point]
        } else if (prev.length === 1) {
          const p1 = prev[0]

          const calculatedDistance = p1.distanceTo(point)

          setDistance(calculatedDistance)
          onMeasure?.(calculatedDistance)
          setLinePoints([p1, point])

          // Beide bolletjes blijven staan, klaar voor nieuwe meting
          return [prev[0], point]
        }
        // Na twee punten → begin opnieuw bij dit punt
        setLinePoints([])
        setDistance(null)
        return [point]
      })
    }

    const canvas = gl.domElement
    canvas.addEventListener("pointerdown", handlePointerDown)
    canvas.addEventListener("pointerup", handlePointerUp)
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown)
      canvas.removeEventListener("pointerup", handlePointerUp)
    }
  }, [enabled, camera, gl.domElement, scene, onMeasure])

  return (
      <group>
        {linePoints.length === 2 && (
            <Line points={linePoints} color="#FF1493" lineWidth={4} transparent opacity={0.8} />
        )}
        {measurePoints.map((point, idx) => (
            <mesh key={idx} position={point}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial color={idx === 0 ? "#00FF00" : "#FF0000"} />
            </mesh>
        ))}
      </group>
  )
}

export function MeasurementDisplay({ distance, isActive }: { distance: number | null; isActive: boolean }) {
  if (!isActive) return null

  return (
    <div className="absolute top-4 left-4 bg-black/80 border border-[#FF1493] rounded-lg p-3 z-50">
      {distance === null ? (
        <>
          <P className="text-[#FF1493] text-sm font-mono">Meet modus ACTIEF</P>
          <P className="text-white/60 text-xs">Shift + klik voor punt 1</P>
          <P className="text-white/60 text-xs">Klik voor punt 2</P>
        </>
      ) : (
        <>
          <P className="text-[#FF1493] text-sm">Gemeten afstand:</P>
          <P className="text-white text-2xl font-bold font-mono">{distance.toFixed(2)} cm</P>
        </>
      )}
    </div>
  )
}