export type Quote = {
    id: string
    status: string
    description: string
    question: string | null
    accepted: boolean
    firstName: string | null
    lastName: string | null
    email: string | null
    createdAt: string
    files: Array<{
        id: string
        filename: string
        type: string
        url: string
    }>
}
