"use client"

import { useRef, useEffect, useMemo } from "react"
import { Mesh } from "three"
import * as THREE from "three"

interface CustomObjectProps {
  geometry: THREE.BufferGeometry
  position: [number, number, number]
  rotationY?: number
  rotationZ?: number
  scaleXY?: number
  scaleZ?: number
  color?: string
  instanceId?: string
  onReady?: (objects: THREE.Object3D[] | null) => void
}

export default function CustomObject({
  geometry,
  position,
  rotationY = 0,
  rotationZ = 0,
  scaleXY = 1,
  scaleZ = 1,
  color = "#FFFFFF",
  instanceId,
  onReady,
}: CustomObjectProps) {
  const meshRef = useRef<Mesh>(null)

  // Clone geometry to avoid sharing between instances
  const clonedGeometry = useMemo(() => geometry.clone(), [geometry])

  // Create material with the specified color
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.4,
      metalness: 0.1,
    })
  }, [color])

  useEffect(() => {
    if (!onReady || !meshRef.current) return

    onReady([meshRef.current])

    return () => {
      onReady(null)
    }
  }, [onReady])

  // Add userData for raycasting if instanceId is provided
  useEffect(() => {
    if (instanceId && meshRef.current) {
      meshRef.current.userData.decorationInstanceId = instanceId
    }
  }, [instanceId])

  return (
    <mesh
      ref={meshRef}
      geometry={clonedGeometry}
      material={material}
      position={position}
      rotation={[0, rotationY, rotationZ]}
      scale={[scaleXY, scaleXY, scaleZ]}
      castShadow
      receiveShadow
    />
  )
}
