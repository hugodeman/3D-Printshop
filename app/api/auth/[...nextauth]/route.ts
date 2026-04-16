import { handlers } from "@/lib/auth"

// Only export handlers if they exist (not during build time)
export const GET = handlers?.GET
export const POST = handlers?.POST
