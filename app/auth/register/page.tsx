"use client"

import React, { useState } from "react"
import { BackgroundMain, BackgroundOverlay, BackgroundContrast2 } from "@/components/ui/Background"
import {H1, H2, P, ErrorText} from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {signIn} from "next-auth/react";
import {AddressForm} from "@/components/forms/AddressForm";

type FormData = {
  // Login credentials (required)
  email: string
  emailConfirm: string
  password: string
  passwordConfirm: string

  // Address (optional, but if partially filled, all required fields must be filled)
  country: string
  firstName: string
  lastName: string
  street: string
  addition: string
  postal: string
  city: string
}

type FormErrors = {
  [K in keyof FormData]?: string
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    emailConfirm: "",
    password: "",
    passwordConfirm: "",
    country: "",
    firstName: "",
    lastName: "",
    street: "",
    addition: "",
    postal: "",
    city: ""
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

    // Required login fields
    if (!formData.email.trim()) {
      newErrors.email = "Email is verplicht"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ongeldig email adres"
    }

    if (!formData.emailConfirm.trim()) {
      newErrors.emailConfirm = "Herhaal email is verplicht"
    } else if (formData.email !== formData.emailConfirm) {
      newErrors.emailConfirm = "Emails komen niet overeen"
    }

    if (!formData.password.trim()) {
      newErrors.password = "Wachtwoord is verplicht"
    } else if (formData.password.length < 8) {
      newErrors.password = "Wachtwoord moet minimaal 8 karakters bevatten"
    }

    if (!formData.passwordConfirm.trim()) {
      newErrors.passwordConfirm = "Herhaal wachtwoord is verplicht"
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "Wachtwoorden komen niet overeen"
    }

    // Address validation: if any address field is filled, all required address fields must be filled
    const addressFields = [formData.country, formData.firstName, formData.lastName, formData.street, formData.postal, formData.city]
    const hasAnyAddressField = addressFields.some(field => field.trim() !== "")

    if (hasAnyAddressField) {
      if (!formData.country.trim()) {
        newErrors.country = "Land is verplicht als je een adres invult"
      }
      if (!formData.firstName.trim()) {
        newErrors.firstName = "Voornaam is verplicht als je een adres invult"
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Achternaam is verplicht als je een adres invult"
      }
      if (!formData.street.trim()) {
        newErrors.street = "Adres is verplicht als je een adres invult"
      }
      if (!formData.postal.trim()) {
        newErrors.postal = "Postcode is verplicht als je een adres invult"
      }
      if (!formData.city.trim()) {
        newErrors.city = "Woonplaats is verplicht als je een adres invult"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ email: data.error })
        } else {
          setErrors({ email: "Er is iets misgegaan. Probeer het opnieuw." })
        }
        return
      }

      // Automatisch inloggen na registratie
      await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirectTo: "/",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BackgroundMain>
      {/* Header Overlay */}
      <BackgroundOverlay className="mb-8 py-10 flex flex-col justify-center items-center text-center">
        <H1>Maak je account aan</H1>
        <H2 className="mt-5">Stel je gegevens in en voeg alvast, of later, een bezorgadres toe</H2>
      </BackgroundOverlay>

      {/* Main Form */}
      <div className="w-1/2 mx-auto px-6 pb-12">
        <BackgroundContrast2 className="p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
            {/* Login Credentials Section */}
            <div>
              <H2 className="mb-8">Inloggegevens *</H2>
              <div className="space-y-6">
                <div>
                  <label className="block" hidden={true}>
                    <P>Email</P>
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="Email"
                  />
                   {errors.email && <ErrorText>{errors.email}</ErrorText>}
                </div>

                <div>
                  <label className="block" hidden={true}>
                    <P>Herhaal Email </P>
                  </label>
                  <Input
                    type="email"
                    value={formData.emailConfirm}
                    onChange={(e) => updateField("emailConfirm", e.target.value)}
                    placeholder="Herhaal Email"
                  />
                   {errors.emailConfirm && <ErrorText>{errors.emailConfirm}</ErrorText>}
                </div>

                <div>
                  <label className="block" hidden={true}>
                    <P>Wachtwoord</P>
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Wachtwoord"
                  />
                   {errors.password && <ErrorText>{errors.password}</ErrorText>}
                </div>

                <div>
                  <label className="block" hidden={true}>
                    <P>Herhaal wachtwoord *</P>
                  </label>
                  <Input
                    type="password"
                    value={formData.passwordConfirm}
                    onChange={(e) => updateField("passwordConfirm", e.target.value)}
                    placeholder="Herhaal Wachtwoord"
                  />
                   {errors.passwordConfirm && <ErrorText>{errors.passwordConfirm}</ErrorText>}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <H2>Bezorgadress</H2>
            <AddressForm
                data={{
                  country: formData.country,
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  street: formData.street,
                  addition: formData.addition,
                  postal: formData.postal,
                  city: formData.city,
                }}
                errors={errors}
                onChange={(field, value) => updateField(field, value)}
                disabled={false}
            />

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-48"
              >
                {isSubmitting ? "Account aanmaken..." : "Account aanmaken"}
              </Button>
            </div>
          </form>
        </BackgroundContrast2>
      </div>
    </BackgroundMain>
  )
}
