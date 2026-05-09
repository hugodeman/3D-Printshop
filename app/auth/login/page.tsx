"use client"

import React, { useState } from "react"
import Link from "next/link"
import {BackgroundMain, BackgroundOverlay, BackgroundContrast1} from "@/components/ui/Background"
import {H1, H2, H3, P, ErrorText} from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { signIn } from "next-auth/react"
import {useRouter, useSearchParams} from "next/navigation"

type FormData = {
  email: string
  password: string
}

type FormErrors = {
  [K in keyof FormData]?: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: ""
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = "Email is verplicht"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ongeldig email adres"
    }

    if (!formData.password.trim()) {
      newErrors.password = "Wachtwoord is verplicht"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setErrors({ password: "Ongeldig email of wachtwoord", email:"Ongeldig email of wachtwoord" })
        setFormData(prev => ({ ...prev, password: "" }))
      } else {
        const redirect = searchParams.get("redirect")
        router.push(redirect ?? "/")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BackgroundMain>
      {/* Header Overlay */}
      <BackgroundOverlay>
        <H1>Login</H1>
        <H2>Log in op je account om verder te gaan</H2>
      </BackgroundOverlay>

      {/* Login Form */}
      <div className="w-1/2 mx-auto px-6 pb-12">
        <BackgroundContrast1 className="p-8 flex flex-col justify-center rounded-2xl items-center">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-1/2 w-full">
            <div>
              <label className="block mb-2">
                <H3 className={"text-contrast"}>Email:</H3>
              </label>
              <Input
                type="text"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="Email"
                variant="contrast"
              />
              {errors.email && <ErrorText className={"text-red-500"}>{errors.email}</ErrorText>}
            </div>

            <div>
              <label className="block mb-2 mt-8">
                <H3 className={"text-contrast"}>Wachtwoord:</H3>
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Wachtwoord"
                variant="contrast"
              />
              {errors.password && <ErrorText className={"text-red-500"}>{errors.password}</ErrorText>}
            </div>

            {/* Submit Button */}
            <div className="pt-6 flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-1/4 min-w-32"
                variant="secondary"
              >
                <P className={"text-center"}>{isSubmitting ? "Login..." : "Login"}</P>
              </Button>
            </div>

            {/* Register Link */}
            <div className="text-center pt-4">
              <H3 className="text-contrast">
                Nog geen account?{" "}
                <Link href="/auth/register" className="text-[#6D8F78] underline text-h3 hover:text-[#6D8F78]/50">
                  Maak er een aan
                </Link>
              </H3>
            </div>
          </form>
        </BackgroundContrast1>
      </div>
    </BackgroundMain>
  )
}
