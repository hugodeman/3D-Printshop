"use client"

import { useState } from "react"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"

type Props = {
    images: Array<{ id: string, url: string }>
    title: string
}

export default function ProductImageSlider({ images, title }: Props) {
    const [current, setCurrent] = useState(0)
    const [lightboxOpen, setLightboxOpen] = useState(false)

    const prev = () => setCurrent((i) => (i === 0 ? images.length - 1 : i - 1))
    const next = () => setCurrent((i) => (i === images.length - 1 ? 0 : i + 1))

    if (images.length === 0) return null

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
                <button onClick={prev}>
                    <Icon name={"ArrowBigLeft"} size={40} className={"cursor-pointer"}/>
                </button>

                <Image
                    src={images[current].url}
                    alt={title}
                    width={400}
                    height={400}
                    loading="lazy"
                    onClick={() => setLightboxOpen(true)}
                    className="object-cover cursor-pointer"
                />

                <button onClick={next}>
                    <Icon name={"ArrowBigRight"} size={40} className={"cursor-pointer"}/>
                </button>
            </div>

            <div className="flex gap-2">
                {images.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}>
                        <Icon name={i === current ? "CircleDot" : "Circle"} size={15} className={"cursor-pointer"}/>
                    </button>
                ))}
            </div>

            {lightboxOpen && (
                <div onClick={() => setLightboxOpen(false)} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                    <button onClick={() => setLightboxOpen(false)} className="absolute top-6 right-6">
                        <Icon name={"X"} size={30} />
                    </button>

                    <Image
                        src={images[current].url}
                        alt={title}
                        width={800}
                        height={800}
                        className="object-contain max-h-screen cursor-zoom-out"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}