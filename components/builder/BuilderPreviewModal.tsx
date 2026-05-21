"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { BackgroundContrast1 } from "@/components/ui/Background"
import { Icon } from "@/components/ui/Icon"
import {GLTFObject} from "@/components/builder/GLTFObject";
import {getPlatformModelScaleVector} from "@/lib/builder-scene-scale"
import {assetsById} from "@/lib/builder-model-assets";
import {BuilderConfig} from "@/types/BuilderConfig"

type Props = {
    isOpen: boolean
    onCloseAction: () => void
    config: BuilderConfig
}

export default function BuilderPreviewModal({ isOpen, onCloseAction, config }: Props) {
    if (!isOpen) return null

    const platform = assetsById.get(config.platformId)

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onCloseAction}
        >
            <BackgroundContrast1
                className="rounded-2xl w-full max-w-6xl h-[85vh] relative flex flex-col "
            >
                <div className={"flex-1"} onClick={(e) => e.stopPropagation()}>
                    <button className="absolute top-4 right-4 z-10" onClick={onCloseAction}>
                        <Icon name="X" size={24} className="cursor-pointer" />
                    </button>

                    <Canvas
                        camera={{ position: [4.5, 4.5, 4.5], fov: 46 }}
                        dpr={1}
                        className="rounded-2xl"
                    >
                        <color attach="background" args={["#1F2126"]} />
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[6, 9, 4]} intensity={1.2} />

                        <Suspense fallback={null}>
                            {platform && (
                                <GLTFObject
                                    modelPath={platform.modelPath}
                                    position={platform.spawnPosition ?? [0, 0, 0]}
                                    scaleVector={getPlatformModelScaleVector(config.platformSize)}
                                    tintColor={config.platformColor}
                                />
                            )}

                            {config.decorations.map((deco) => {
                                const asset = assetsById.get(deco.assetId)
                                if (!asset) return null
                                return (
                                    <GLTFObject
                                        key={deco.instanceId}
                                        modelPath={asset.modelPath}
                                        position={deco.position}
                                        rotationY={deco.rotationY}
                                        scale={deco.scale}
                                        tintColor={deco.color}
                                        partColors={deco.partColors}
                                    />
                                )
                            })}
                        </Suspense>

                        <OrbitControls makeDefault minDistance={1.5} maxDistance={30} />
                    </Canvas>
                </div>
            </BackgroundContrast1>
        </div>
    )
}