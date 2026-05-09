import { POST } from './route'

// Prisma mocken
vi.mock('@/lib/prisma', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}))

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('gehashed_wachtwoord'),
    },
}))

import prisma from '@/lib/prisma'

const makeRequest = (body: object) =>
    new Request('http://localhost/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

describe('POST /api/register', () => {
    beforeEach(() => {
        vi.mocked(prisma.user.findUnique).mockClear()
        vi.mocked(prisma.user.create).mockClear()
    })

    it('maakt een gebruiker aan en geeft 201 terug', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.user.create).mockResolvedValue({ id: '1', email: 'jan@example.com' } as never)

        const res = await POST(makeRequest({ email: 'Jan@Example.com', password: 'wachtwoord123' }))
        const data = await res.json()

        expect(res.status).toBe(201)
        expect(data.email).toBe('jan@example.com') // genormaliseerd naar lowercase
    })

    it('geeft 409 als email al bestaat', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as never)

        const res = await POST(makeRequest({ email: 'jan@example.com', password: 'wachtwoord123' }))

        expect(res.status).toBe(409)
    })

    it('normaliseert email naar lowercase', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.user.create).mockResolvedValue({ id: '1', email: 'jan@example.com' } as never)

        await POST(makeRequest({ email: 'JAN@EXAMPLE.COM', password: 'wachtwoord123' }))

        expect(prisma.user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ email: 'jan@example.com' }),
            })
        )
    })

    it('maakt adres aan als firstName meegegeven wordt', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.user.create).mockResolvedValue({ id: '1', email: 'jan@example.com' } as never)

        await POST(makeRequest({
            email: 'jan@example.com',
            password: 'wachtwoord123',
            firstName: 'Jan',
            lastName: 'de Vries',
            country: 'Nederland',
            street: 'Teststraat 1',
            postal: '1234 AB',
            city: 'Amsterdam',
        }))

        expect(prisma.user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    addresses: expect.objectContaining({ create: expect.any(Object) }),
                }),
            })
        )
    })

    it('geeft 500 terug bij een onverwachte fout', async () => {
        vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB fout'))

        const res = await POST(makeRequest({ email: 'jan@example.com', password: 'wachtwoord123' }))

        expect(res.status).toBe(500)
    })
})