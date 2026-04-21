"use client"

import React, { useState } from "react"
import { BackgroundMain, BackgroundOverlay, BackgroundContrast2 } from "@/components/ui/Background"
import {H1, H2, P, ErrorText} from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

// Countries list for dropdown
const COUNTRIES = [
  "Nederland",
  "België",
  "Duitsland",
  "Frankrijk",
  "Luxemburg",
  "Verenigd Koninkrijk",
  "Andere"
]

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

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Registration data:", formData)

      // For now, just show success message
      alert("Account registratie succesvol! (Dit is nog een placeholder)")

    } catch (error) {
      console.error("Registration error:", error)
      alert("Er is iets misgegaan bij het registreren. Probeer het opnieuw.")
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
            <div>
              <H2 className="mb-8 pt-10">Bezorgadres</H2>
              <div className="space-y-6">
                <div>
                  <label className="block text-p font-medium" hidden={true}>
                    Land
                  </label>
                  <select
                      value={formData.country}
                      onChange={(e) => updateField("country", e.target.value)}
                      className={`rounded-[5px] border input-shadow outline-none transition-colors h-12 px-4 text-p w-full bg-input-normal border-input-normal`}
                  >
                    <option value="" disabled hidden className={"text-white/40"}>
                      <P className={"text-white/20"}>Land</P>
                    </option>

                    {COUNTRIES.map(country => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                    ))}
                  </select>
                   {errors.country && <ErrorText>{errors.country}</ErrorText>}
                </div>

                <div className="flex justify-between">
                  <div>
                    <label className="block text-p font-medium" hidden={true}>
                      Voornaam
                    </label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      placeholder="Voornaam"
                      inputSize="sm"
                    />
                     {errors.firstName && <ErrorText>{errors.firstName}</ErrorText>}
                  </div>

                  <div>
                    <label className="block" hidden={true}>
                      Achternaam
                    </label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      placeholder="Achternaam"
                      inputSize="sm"
                    />
                     {errors.lastName && <ErrorText>{errors.lastName}</ErrorText>}
                  </div>
                </div>

                <div>
                  <label className="block" hidden={true}>
                    Adres
                  </label>
                  <Input
                    value={formData.street}
                    onChange={(e) => updateField("street", e.target.value)}
                    placeholder="Adres"
                  />
                   {errors.street && <ErrorText>{errors.street}</ErrorText>}
                </div>

                <div className="gap-6">
                  <div>
                    <label className="block" hidden={true}>
                      Toevoeging
                    </label>
                    <Input
                      value={formData.addition}
                      onChange={(e) => updateField("addition", e.target.value)}
                      placeholder="Toevoeging"
                      inputSize="lg"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <div>
                    <label className="block" hidden={true}>
                      Postcode
                    </label>
                    <Input
                      value={formData.postal}
                      onChange={(e) => updateField("postal", e.target.value)}
                      placeholder="Postcode"
                      inputSize="sm"
                    />
                     {errors.postal && <ErrorText>{errors.postal}</ErrorText>}
                  </div>

                  <div>
                    <label className="block" hidden={true}>
                      Woonplaats
                    </label>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="Woonplaats"
                      inputSize="sm"
                    />
                     {errors.city && <ErrorText>{errors.city}</ErrorText>}
                  </div>
                </div>
              </div>
            </div>

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
