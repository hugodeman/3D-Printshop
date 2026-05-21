import {PartColors, Vec3} from "@/types/BuilderConfig";
import type {Mesh, Object3D, Group as THREE_Group} from "three";
import {useGLTF} from "@react-three/drei";
import {useEffect, useMemo, useRef} from "react";
import {getDecorationModelScale} from "@/lib/builder-scene-scale";
import {applyModelTint} from "@/lib/builder-scene-utils";

export function GLTFObject({
                               modelPath,
                               position,
                               rotationY,
                               scale,
                               scaleVector,
                               tintColor,
                               partColors,
                               instanceId,
                               onReady,
                           }: {
    modelPath: string
    position: Vec3
    rotationY?: number
    scale?: number
    scaleVector?: Vec3
    tintColor: string
    partColors?: PartColors
    instanceId?: string
    onReady?: (objects: Object3D[] | null) => void
}) {
    const gltf = useGLTF(modelPath)
    const groupRef = useRef<THREE_Group>(null)

    const scene = useMemo(() => {
        const clone = gltf.scene.clone(true)
        applyModelTint(clone, tintColor, partColors)

        // Add userData for raycasting
        if (instanceId) {
            clone.traverse((node) => {
                const n = node as unknown as { userData: Record<string, string> }
                n.userData.decorationInstanceId = instanceId
            })
        }

        return clone
    }, [gltf.scene, tintColor, partColors, instanceId])

    useEffect(() => {
        if (!onReady || !groupRef.current) return

        const meshes: Object3D[] = []
        groupRef.current.traverse((child) => {
            const maybeMesh = child as Mesh
            if (maybeMesh.isMesh) meshes.push(maybeMesh)
        })

        onReady(meshes.length > 0 ? meshes : null)

        return () => {
            onReady(null)
        }
    }, [onReady, scene])

    const previewScale: number | Vec3 = scaleVector
        ? scaleVector
        : getDecorationModelScale(scale ?? 1)

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={[0, rotationY ?? 0, 0]}
            scale={previewScale}
        >
            <primitive object={scene} />
        </group>
    )
}