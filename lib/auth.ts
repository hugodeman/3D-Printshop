import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

// Only initialize Prisma client if not in build time and we have DB access
let adapter = undefined

if (typeof window === 'undefined' && process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  // This will only run on server-side in development with DB access
  const prisma = new PrismaClient()
  adapter = PrismaAdapter(prisma)
}

const config = {
  adapter,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID || "dummy",
      clientSecret: process.env.GITHUB_SECRET || "dummy",
    }),
  ],
}

export const { handlers, auth } = NextAuth(config)
