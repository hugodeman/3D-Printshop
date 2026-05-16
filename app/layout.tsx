"use client";
import "./globals.css"
import { Poppins } from "next/font/google"
import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BackgroundMain } from "@/components/ui/Background";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export default function RootLayout({
    children,
  }: {
  children: React.ReactNode
  }) {
  return (
    <SessionProvider>
      <html lang="en">
        <body className={poppins.className}>
          <CartProvider>
            <BackgroundMain>
              <Navbar />
              <main>
               {children}
              </main>
              <Footer />
            </BackgroundMain>
          </CartProvider>
        </body>
      </html>
    </SessionProvider>
  )
}