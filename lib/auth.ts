// import NextAuth from "next-auth"
// import GitHub from "next-auth/providers/github"
//
// const handler = NextAuth({
//     providers: [
//         GitHub({
//             clientId: process.env.GITHUB_ID!,
//             clientSecret: process.env.GITHUB_SECRET!,
//         }),
//     ],
// })
//
// export { handler as GET, handler as POST }
//
// import { PrismaAdapter } from "@next-auth/prisma-adapter"
// import { PrismaClient } from "@prisma/client"
//
// const prisma = new PrismaClient()
//
// NextAuth({
//     adapter: PrismaAdapter(prisma),
//     providers: [...]
// })