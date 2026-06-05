"use client"

import ImageTo3D from "@/components/builder/ImageTo3D";
import {useBuilderStore} from "@/lib/builder-store";

export function AddCustomObjectModal() {
    const isOpen = useBuilderStore((state) => state.isAddCustomObjectModalOpen)
    const onCloseAction = useBuilderStore((state) => state.closeAddCustomObjectModal)
    const addCustomObjectToStore = useBuilderStore((state) => state.addCustomObject)

    if (!isOpen) return null


    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={onCloseAction}
        >
            <div
                className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#1A1C1E] shadow-[0_20px_60px_rgba(0,0,0,0.55)] p-6"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="border-b border-white/10 pb-4 mb-4">
                    <ImageTo3D onAddToScene={addCustomObjectToStore} />
                </div>
            </div>
        </div>
    )
}