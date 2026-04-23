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
  const [distance, setDistance] = useState<number | null>(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())

  useEffect(() => {
    if (!enabled) return

    const handleMouseClick = (e: MouseEvent) => {
      // Only measure on Shift+Click
      if (!e.shiftKey) return

      const canvas = gl.domElement
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)

      // Get all meshes in scene
      const allObjects: THREE.Object3D[] = []
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          allObjects.push(obj)
        }
      })

      const intersects = raycasterRef.current.intersectObjects(allObjects, true)

      if (intersects.length > 0) {
        const point = intersects[0].point.clone()

        setMeasurePoints((prev) => {
          if (prev.length === 0) {
            // First point
            return [point]
          } else if (prev.length === 1) {
            // Second point - calculate distance on X, Y, or Z axis only
            const p1 = prev[0]
            const p2 = point

            // Determine which axis to measure (X, Y, or Z, whichever is largest difference)
            const xDiff = Math.abs(p2.x - p1.x)
            const yDiff = Math.abs(p2.y - p1.y)
            const zDiff = Math.abs(p2.z - p1.z)

            let calculatedDistance: number

            if (xDiff >= yDiff && xDiff >= zDiff) {
              // Measure on X axis (width)
              calculatedDistance = xDiff
              console.log("x-as is groter")
            } else if (yDiff >= xDiff && yDiff >= zDiff) {
              // Measure on Y axis (height)
              calculatedDistance = yDiff
              console.log("y-as is groter")
            } else {
              // Measure on Z axis (depth)
              calculatedDistance = zDiff
              console.log("z-as is groter")
            }

            setDistance(calculatedDistance * 5)
            onMeasure?.(calculatedDistance * 5)

            // Reset after showing measurement
            setTimeout(() => {
              setMeasurePoints([])
              setDistance(null)
            }, 2000)

            return []
          }
          return prev
        })
      }
    }

    window.addEventListener("click", handleMouseClick)
    return () => window.removeEventListener("click", handleMouseClick)
  }, [enabled, camera, gl.domElement, scene, onMeasure])

  return (
    <group>
      {/* Show measurement line if we have both points */}
      {measurePoints.length === 2 && (
        <Line
          points={measurePoints}
          color="#FF1493"
          lineWidth={4}
          transparent
          opacity={0.8}
        />
      )}

      {/* Show first measurement point as sphere */}
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