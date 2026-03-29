<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Overview

This is a 3D print shop application built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. It integrates Prisma for database management, NextAuth for authentication, Mollie for payments, UploadThing for file uploads, Three.js for 3D rendering, and Zustand for state management.

## Architecture

- **Routing**: Uses Next.js App Router. Pages in `app/`, API routes in `app/api/`.
- **Components**: Reusable components in `components/`, organized by feature (e.g., `builder/`, `shop/`, `ui/`).
- **Utilities**: Helper functions and configurations in `lib/`.
- **Database**: Prisma schema in `prisma/schema.prisma`, client generated to `app/generated/prisma`.
- **Styling**: Tailwind CSS v4 with custom typography classes (e.g., `text-h1`, `text-h2`) defined in `components/ui/Typography.tsx`.

## Authentication

Use NextAuth v4 with PrismaAdapter for user authentication. Configure providers in `lib/auth.ts` and handle routes in `app/api/auth/[...nextauth]/route.ts`.

Example setup in `lib/auth.ts`:
```typescript
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
})
```

## Database

Use Prisma with PostgreSQL. Define models in `prisma/schema.prisma`. Run migrations with `npx prisma migrate dev`.

Prisma client is instantiated in `lib/prisma.ts` with global singleton pattern for development.

## Payments

Integrate Mollie API for payment processing. Client setup in `lib/mollie.ts`, API handlers in `app/api/mollie/route.ts`.

Example payment creation:
```typescript
import createMollieClient from "@mollie/api-client"

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY!,
})

export async function createPayment(amount: string, description: string) {
  const payment = await mollieClient.payments.create({
    amount: { currency: "EUR", value: amount },
    description,
    redirectUrl: "http://localhost:3000/success",
  })
  return payment.getCheckoutUrl()
}
```

## File Uploads

Use UploadThing for file handling. Configure in `lib/uploadthing.ts`, route in `app/api/uploadthing/route.ts`.

## 3D Rendering

Use React Three Fiber and @react-three/drei for 3D scenes. Main canvas component in `components/builder/Canvas3D.tsx`.

Example basic scene:
```tsx
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"

export default function Scene() {
  return (
    <Canvas>
      <ambientLight />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>
      <OrbitControls />
    </Canvas>
  )
}
```

## State Management

Use Zustand for client-side state. Create stores in `lib/` or directly in components.

## Development Workflow

- **Start dev server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Database**: Use `npx prisma studio` to view data, `npx prisma generate` after schema changes.

Ensure all new code follows TypeScript strict mode and ESLint rules as configured in `eslint.config.mjs`.
