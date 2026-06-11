"use client"

import React, {useEffect, useState} from "react"
import {useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import { BackgroundMain, BackgroundOverlay, BackgroundContrast2 } from "@/components/ui/Background"
import { H1, H2, H3, P, ErrorText } from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {Icon} from "@/components/ui/Icon";

type ContactData = {
    firstName: string
    lastName: string
    email: string
}

type ContactErrors = {
    [K in keyof ContactData]?: string
}

export default function QuotesPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [ready, setReady] = useState(() =>
        typeof window !== "undefined" ? localStorage.getItem("ready") === "true" : false
    )

    const handleStart = () => {
        if (!session?.user.id) {
            router.push("/auth/login?redirect=/quote")
        }
        localStorage.setItem("ready", "true")
        setReady(true)
    }

    useEffect(() => {
        const fetchProfile = async () => {
            const res = await fetch("/api/users/")
            if (!res.ok) return
            const data = await res.json()
            if (data.address) {
                setContactData(prev => ({
                    firstName: prev.firstName || data.address.firstName || "",
                    lastName: prev.lastName || data.address.lastName || "",
                    email: prev.email || session?.user?.email || "",
                }))
            }
        }
        fetchProfile()
    }, [])

    const [contactData, setContactData] = useState<ContactData>( () => {
      if (typeof window === "undefined") return {firstName: "", lastName: "", email: "",}
      return {
          firstName: localStorage.getItem("quote_firstName") ?? "",
          lastName: localStorage.getItem("quote_lastName") ?? "",
          email: localStorage.getItem("quote_email") ?? "",
      }

    })
    const [contactErrors, setContactErrors] = useState<ContactErrors>({})

    const [modelFile, setModelFile] = useState<File | null>(null)
    const [photoFiles, setPhotoFiles] = useState<File[]>([])

    const [description, setDescription] = useState(() =>
        typeof window !== "undefined" ? localStorage.getItem("quote_description") ?? "" : ""
    )
    const [descriptionError, setDescriptionError] = useState("")

    const [questions, setQuestions] = useState(() =>
        typeof window !== "undefined" ? localStorage.getItem("quote_questions") ?? "" : ""
    )

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")

    const updateContact = (field: keyof ContactData, value: string) => {
        setContactData((prev) => ({ ...prev, [field]: value }))
        localStorage.setItem(`quote_${field}`, value)
        if (contactErrors[field]) {
            setContactErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    const validateContact = (): boolean => {
        const newErrors: ContactErrors = {}

        if (!contactData.firstName.trim()) newErrors.firstName = "Voornaam is verplicht"
        if (!contactData.lastName.trim()) newErrors.lastName = "Achternaam is verplicht"
        if (!contactData.email.trim()) {
            newErrors.email = "Email is verplicht"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
            newErrors.email = "Ongeldig email adres"
        }

        setContactErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!description.trim()) setDescriptionError("Geef een omschrijving van wat je wilt hebben")

        if (!validateContact() || !description.trim()) return

        setIsSubmitting(true)

        const formData = new FormData();

        formData.append("firstName", contactData.firstName);
        formData.append("lastName", contactData.lastName);
        formData.append("email", contactData.email);
        formData.append("description", description);
        formData.append("question", questions);

        if (modelFile) {
            formData.append("modelFile", modelFile);
        }

        photoFiles.forEach((file) => {
            formData.append("photoFiles", file);
        });

        try {
            const response = await fetch("/api/quotes", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const data = await response.json()
                setError(data.error || "Failed to create quote")
                return
            }

            localStorage.removeItem("quote_firstName")
            localStorage.removeItem("quote_lastName")
            localStorage.removeItem("quote_email")
            localStorage.removeItem("quote_description")
            localStorage.removeItem("quote_questions")
            localStorage.removeItem("ready")
            setSubmitted(true)
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred"
            setError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const steps = [
        {
            step: "Stap 1 – Vul de offerte in",
            icon: (
                <Icon name={"PenTool"}/>
            ),
            description: "Beschrijf je product",
        },
        {
            step: "Stap 2 – Wij bekijken de offerte",
            icon: (
                <Icon name={"Search"}/>
            ),
            description:
                "Wij proberen in 2 dagen de offerte te bekijken en eventuele aanpassingen te maken of voor meer informatie vragen",
        },
        {
            step: "Stap 3 – Overeenkomst",
            icon: (
                <Icon name={"ThumbsUp"}/>
            ),
            description: "Samen komen we tot een akkoord",
        },
    ]

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    if (submitted) {
        return (
            <BackgroundMain>
                <BackgroundOverlay>
                    <H1>Offerte maken</H1>
                    <H2>Vraag je eigen product aan precies zoals jij wilt of geef je idee door.</H2>
                </BackgroundOverlay>
                <div className="w-1/2 mx-auto px-6 pb-12">
                    <BackgroundContrast2 className="p-12 flex flex-col items-center justify-center rounded-2xl gap-4 text-center">
                        <Icon name={"CircleCheck"} color={"#6D8F78"} size={64}/>
                        <H1>Offerte verstuurd!</H1>
                        <H2>Bedankt voor je aanvraag. We nemen binnen 2 werkdagen contact met je op.</H2>
                    </BackgroundContrast2>
                </div>
            </BackgroundMain>
        )
    }

    return (
        <BackgroundMain>
            {/* Header Overlay */}
            <BackgroundOverlay>
                <H1>Offerte maken</H1>
                <H2>Vraag je eigen product aan precies zoals jij wilt of geef je idee door.</H2>
            </BackgroundOverlay>

            <div className="w-1/2 mx-auto px-6 pb-12 flex flex-col gap-6">
                {/* How it works block */}
                <BackgroundContrast2 className="p-8 rounded-2xl">
                    <H2 className="text-center mb-8">Hoe werkt het?</H2>
                    <div className="flex items-start justify-between gap-4">
                        {steps.map((s, i) => (
                            <React.Fragment key={i}>
                                <div className="flex flex-col items-center text-center gap-3 flex-1">
                                    <H3 className="font-semibold">{s.step}</H3>
                                    <div className="opacity-80">{s.icon}</div>
                                    <P className="opacity-80 text-sm">{s.description}</P>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="mt-12 opacity-50 shrink-0">
                                        <Icon name={"ArrowBigRight"}/>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </BackgroundContrast2>

                {!ready && (
                    <div className={"flex justify-center w-full"}>
                        <Button onClick={handleStart} className={"mt-10 min-w-1/3"}>Start offerte</Button>
                    </div>
                )}

                {/* Form block */}
                {ready && (
                    <BackgroundContrast2 className="p-8 rounded-2xl">
                        <div className={"p-8 flex flex-col gap-6 w-full justify-center items-center"}>
                            {/* Contact */}
                            <div className={"w-1/2"}>
                                <H3 className="mb-4">Contactgegevens *</H3>
                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={contactData.firstName}
                                            onChange={(e) => updateContact("firstName", e.target.value)}
                                            placeholder="Voornaam"
                                        />
                                        {contactErrors.firstName && <ErrorText>{contactErrors.firstName}</ErrorText>}
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            value={contactData.lastName}
                                            onChange={(e) => updateContact("lastName", e.target.value)}
                                            placeholder="Achternaam"
                                        />
                                        {contactErrors.lastName && <ErrorText>{contactErrors.lastName}</ErrorText>}
                                    </div>
                                </div>
                                <Input
                                    type="text"
                                    value={contactData.email}
                                    onChange={(e) => updateContact("email", e.target.value)}
                                    placeholder="E-mail"
                                />
                                {contactErrors.email && <ErrorText>{contactErrors.email}</ErrorText>}
                            </div>

                            {/* Model upload */}
                            <div className={"w-1/2"}>
                                <H3 className="mb-2">Upload bestand van je model (STL, 3MF, OBJ)</H3>
                                <label className="flex items-center justify-between gap-4 border border-dashed border-white/30 rounded-xl p-6 cursor-pointer hover:border-white/50 transition-colors">
                                    <div className="flex items-center gap-3 opacity-70">
                                        <Icon name={"FilePlus"}/>
                                        <P className="opacity-70">
                                            {modelFile ? modelFile.name : "Selecteer bestand of sleep vanaf je computer"}
                                        </P>
                                    </div>
                                    <Icon name={"Upload"}/>
                                    <input
                                        type="file"
                                        accept=".stl,.3mf,.obj"
                                        className="hidden"
                                        onChange={(e) => setModelFile(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            </div>

                            {/* Description */}
                            <div className={"w-1/2"}>
                                <H3 className="mb-1">Beschrijf je doel zo duidelijk mogelijk: * </H3>
                                <P className="opacity-60 mb-2 text-sm">
                                    Wat wil je hebben? Welke afmetingen? Waar is het voor? Wat voor kleur?
                                </P>
                                <textarea
                                    placeholder="..."
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value)
                                        localStorage.setItem("quote_description", e.target.value)
                                    }}
                                    rows={4}
                                    className="rounded-lg border p-3 w-full min-w-60 h-40 resize-none bg-input-normal border-input-normal outline-none input-shadow mt-2"
                                />
                                <ErrorText>{descriptionError}</ErrorText>
                            </div>

                            {/* Photo upload */}
                            <div className={"w-1/2"}>
                                <H3 className="mb-2">Upload je foto(s) voor extra informatie</H3>
                                <label className="flex items-center justify-between gap-4 border border-dashed border-white/30 rounded-xl p-6 cursor-pointer hover:border-white/50 transition-colors">
                                    <div className="flex items-center gap-3 opacity-70">
                                        <Icon name={"Image"}/>
                                        <P className="opacity-70">
                                            {photoFiles.length > 0
                                                ? `${photoFiles.length} bestand(en) geselecteerd`
                                                : "Selecteer bestand of sleep vanaf je computer"}
                                        </P>
                                    </div>
                                    <Icon name={"Upload"}/>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
                                    />
                                </label>
                            </div>

                            {/* Questions */}
                            <div className={"w-1/2"}>
                                <H3 className="mb-2">Stuur hier je vragen</H3>
                                <textarea
                                    placeholder="..."
                                    value={questions}
                                    onChange={(e) => {
                                        setQuestions(e.target.value)
                                        localStorage.setItem("quote_questions", e.target.value)
                                    }}
                                    className="rounded-lg border p-3 w-full min-w-60 h-40 resize-none bg-input-normal border-input-normal outline-none input-shadow mt-2"
                                />
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="w-1/2">
                                    <ErrorText className="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                                        {error}
                                    </ErrorText>
                                </div>
                            )}

                            {/* Submit */}
                            <div className="flex justify-center pt-2">
                                <Button
                                    disabled={isSubmitting}
                                    onClick={handleSubmit}
                                    className={"min-w-50"}
                                >
                                    {isSubmitting ? "Versturen..." : "Stuur offerte op"}
                                </Button>
                            </div>
                        </div>
                    </BackgroundContrast2>
                )}
            </div>
        </BackgroundMain>
    )
}