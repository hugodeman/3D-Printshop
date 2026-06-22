"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { H1, H2, H3, P, ErrorText } from "@/components/ui/Typography"
import { BackgroundMain, BackgroundContrast2, BackgroundOverlay } from "@/components/ui/Background"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"

type ProductType = "FIGURE" | "PRACTICAL"

type FormData = {
    title: string
    description: string
    price: string
    type: ProductType
    filament: string
    dimensions: string
    deliveryTime: string
    newImages: File[]
}

type FormErrors = Partial<Record<keyof FormData | "images", string>>

export default function EditProductPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const productId = params.productId as string

    const [formData, setFormData] = useState<FormData>({
        title: "",
        description: "",
        price: "",
        type: "FIGURE",
        filament: "",
        dimensions: "",
        deliveryTime: "",
        newImages: [],
    })

    // Bestaande afbeeldingen (al opgeslagen in DB)
    const [existingImages, setExistingImages] = useState<string[]>([])
    // Previews van nieuwe uploads
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])

    const [errors, setErrors] = useState<FormErrors>({})
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Redirect als geen admin
    useEffect(() => {
        if (status === "loading") return
        if (!session || session.user.role !== "ADMIN") {
            router.replace("/")
        }
    }, [session, status, router])

    // Product ophalen
    useEffect(() => {
        if (!productId) return
        const fetchProduct = async () => {
            const res = await fetch(`/api/products/${productId}`)
            if (!res.ok) return
            const data = await res.json()
            setFormData({
                title: data.title,
                description: data.description,
                price: String(data.price),
                type: data.type,
                filament: data.filament ?? "",
                dimensions: data.dimensions ?? "",
                deliveryTime: String(data.deliveryTime ?? ""),
                newImages: [],
            })
            setExistingImages(data.images.map((img: { url: string }) => img.url))
        }
        fetchProduct()
    }, [productId])

    if (status === "loading") return <BackgroundMain><P>Laden...</P></BackgroundMain>
    if (!session || session.user.role !== "ADMIN") return null

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleTypeChange = (type: ProductType) => {
        setFormData(prev => ({ ...prev, type }))
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        if (files.length === 0) return
        setFormData(prev => ({ ...prev, newImages: [...prev.newImages, ...files] }))
        setNewImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    }

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index))
    }

    const removeNewImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            newImages: prev.newImages.filter((_, i) => i !== index),
        }))
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    const validate = (): boolean => {
        const newErrors: FormErrors = {}
        if (!formData.title.trim()) newErrors.title = "Titel is verplicht"
        if (!formData.description.trim()) newErrors.description = "Beschrijving is verplicht"
        if (!formData.price.trim()) newErrors.price = "Prijs is verplicht"
        else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) newErrors.price = "Voer een geldige prijs in"
        if (!formData.deliveryTime.trim()) newErrors.deliveryTime = "Maaktijd is verplicht"
        else if (isNaN(Number(formData.deliveryTime)) || Number(formData.deliveryTime) <= 0) newErrors.deliveryTime = "Voer een geldige maaktijd in"
        if (existingImages.length === 0 && formData.newImages.length === 0) newErrors.images = "Voeg minimaal één afbeelding toe"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault()
        if (!validate()) return
        setIsSaving(true)

        try {
            // Nieuwe afbeeldingen uploaden indien aanwezig
            let newUrls: string[] = []
            if (formData.newImages.length > 0) {
                const uploadForm = new FormData()
                formData.newImages.forEach(img => uploadForm.append("images", img))
                const uploadRes = await fetch("/api/products/files", {
                    method: "POST",
                    body: uploadForm,
                })
                const data = await uploadRes.json()
                newUrls = data.urls
            }

            // Alle afbeeldingen combineren (bestaande + nieuwe)
            const allImages = [...existingImages, ...newUrls]

            const res = await fetch(`/api/products/${productId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    price: Number(formData.price),
                    type: formData.type,
                    filament: formData.filament,
                    dimensions: formData.dimensions,
                    deliveryTime: Number(formData.deliveryTime),
                    images: allImages,
                }),
            })

            if (res.ok) {
                setSaveSuccess(true)
                setTimeout(() => router.push("/webshop"), 1500)
            }
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <BackgroundMain>
            <BackgroundOverlay>
                <H1>Product bewerken</H1>
                <H2 className="mt-2">Pas de productgegevens aan</H2>
            </BackgroundOverlay>

            <div className="flex justify-center px-6 pb-12 pt-6">
                <form onSubmit={handleSubmit} className="w-full max-w-3xl flex flex-col gap-6">

                    {/* Basisgegevens */}
                    <BackgroundContrast2 className="p-8 rounded-2xl">
                        <H2 className="mb-6">Basisgegevens</H2>
                        <div className="space-y-4">
                            <div>
                                <P className="mb-1 text-white/70">Titel</P>
                                <Input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => handleChange("title", e.target.value)}
                                    placeholder="Productnaam"
                                />
                                {errors.title && <ErrorText>{errors.title}</ErrorText>}
                            </div>

                            <div>
                                <P className="mb-1 text-white/70">Beschrijving</P>
                                <textarea
                                    value={formData.description}
                                    onChange={e => handleChange("description", e.target.value)}
                                    placeholder="Beschrijf het product..."
                                    rows={4}
                                    className="rounded-lg border p-3 w-full resize-none bg-input-normal border-input-normal outline-none input-shadow"
                                />
                                {errors.description && <ErrorText>{errors.description}</ErrorText>}
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <P className="mb-1 text-white/70">Prijs (€)</P>
                                    <Input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => handleChange("price", e.target.value)}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                    {errors.price && <ErrorText>{errors.price}</ErrorText>}
                                </div>
                                <div className="flex-1">
                                    <P className="mb-1 text-white/70">Maaktijd (uur)</P>
                                    <Input
                                        type="number"
                                        value={formData.deliveryTime}
                                        onChange={e => handleChange("deliveryTime", e.target.value)}
                                        placeholder="0"
                                        min="0"
                                    />
                                    {errors.deliveryTime && <ErrorText>{errors.deliveryTime}</ErrorText>}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <P className="mb-1 text-white/70">Filament (optioneel)</P>
                                    <Input
                                        type="text"
                                        value={formData.filament}
                                        onChange={e => handleChange("filament", e.target.value)}
                                        placeholder="bijv. PLA, PETG"
                                    />
                                </div>
                                <div className="flex-1">
                                    <P className="mb-1 text-white/70">Afmetingen (optioneel)</P>
                                    <Input
                                        type="text"
                                        value={formData.dimensions}
                                        onChange={e => handleChange("dimensions", e.target.value)}
                                        placeholder="bijv. 10x10x10 cm"
                                    />
                                </div>
                            </div>
                        </div>
                    </BackgroundContrast2>

                    {/* Type */}
                    <BackgroundContrast2 className="p-8 rounded-2xl">
                        <H2 className="mb-6">Producttype</H2>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-3 cursor-pointer" onClick={() => handleTypeChange("FIGURE")}>
                                <Icon name={formData.type === "FIGURE" ? "CircleDot" : "Circle"} size={24} />
                                <H3>Figuur</H3>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer" onClick={() => handleTypeChange("PRACTICAL")}>
                                <Icon name={formData.type === "PRACTICAL" ? "CircleDot" : "Circle"} size={24} />
                                <H3>Praktisch</H3>
                            </label>
                        </div>
                    </BackgroundContrast2>

                    {/* Afbeeldingen */}
                    <BackgroundContrast2 className="p-8 rounded-2xl">
                        <H2 className="mb-6">Afbeeldingen</H2>

                        <label className="cursor-pointer flex items-center gap-3 mb-4">
                            <Icon name="Upload" size={25} opacity="70%" />
                            <H3 className="text-action underline">Afbeelding toevoegen</H3>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </label>

                        {errors.images && <ErrorText>{errors.images}</ErrorText>}

                        <div className="flex flex-wrap gap-4 mt-4">
                            {/* Bestaande afbeeldingen */}
                            {existingImages.map((src, i) => (
                                <div key={`existing-${i}`} className="relative">
                                    <Image
                                        src={src}
                                        alt={`Afbeelding ${i + 1}`}
                                        width={128}
                                        height={128}
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(i)}
                                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 cursor-pointer"
                                    >
                                        <Icon name="X" size={20} color="white" />
                                    </button>
                                </div>
                            ))}

                            {/* Nieuwe afbeeldingen */}
                            {newImagePreviews.map((src, i) => (
                                <div key={`new-${i}`} className="relative">
                                    <Image
                                        src={src}
                                        alt={`Nieuw ${i + 1}`}
                                        width={128}
                                        height={128}
                                        className="w-32 h-32 object-cover rounded-lg opacity-80 border-2 border-action"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(i)}
                                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 cursor-pointer"
                                    >
                                        <Icon name="X" size={20} color="white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </BackgroundContrast2>

                    {/* Opslaan */}
                    <div className="flex justify-center pb-6">
                        <Button type="submit" disabled={isSaving} className="min-w-56">
                            {isSaving ? "Opslaan..." : saveSuccess ? "Opgeslagen!" : "Wijzigingen opslaan"}
                        </Button>
                    </div>
                </form>
            </div>
        </BackgroundMain>
    )
}