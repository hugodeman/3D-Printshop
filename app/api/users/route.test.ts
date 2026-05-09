// api/users/route.test.ts
import { GET, PUT } from './route'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
    default: {
        user: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
        address: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    },
}))
vi.mock('bcryptjs', () => ({
    hash: vi.fn().mockResolvedValue('gehashed'),
}))

const makeRequest = (body: object) =>
    new Request('http://localhost/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

beforeEach(() => vi.clearAllMocks())

describe('GET /api/users', () => {
    it('geeft 401 als niet ingelogd', async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        vi.mocked(auth).mockResolvedValue(null)
        const res = await GET()
        expect(res.status).toBe(401)
    })

    it('geeft email en adres terug', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            email: 'jan@example.com',
            addresses: [{ firstName: 'Jan', city: 'Amsterdam' }],
        } as never)

        const res = await GET()
        const data = await res.json()

        expect(data.email).toBe('jan@example.com')
        expect(data.address.firstName).toBe('Jan')
    })

    it('geeft null adres terug als geen adres bestaat', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            email: 'jan@example.com',
            addresses: [],
        } as never)

        const res = await GET()
        const data = await res.json()
        expect(data.address).toBeNull()
    })
})

describe('PUT /api/users — address', () => {
    it('update bestaand adres', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(prisma.address.findFirst).mockResolvedValue({ id: 'addr-1' } as never)

        const res = await PUT(makeRequest({
            type: 'address',
            firstName: 'Jan', lastName: 'de Vries',
            country: 'Nederland', postal: '1234 AB',
            street: 'Teststraat 1', addition: '', city: 'Amsterdam',
        }))

        expect(prisma.address.update).toHaveBeenCalled()
        expect(prisma.address.create).not.toHaveBeenCalled()
        expect(res.status).toBe(200)
    })

    it('maakt nieuw adres aan als geen adres bestaat', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(prisma.address.findFirst).mockResolvedValue(null)

        await PUT(makeRequest({
            type: 'address',
            firstName: 'Jan', lastName: 'de Vries',
            country: 'Nederland', postal: '1234 AB',
            street: 'Teststraat 1', addition: '', city: 'Amsterdam',
        }))

        expect(prisma.address.create).toHaveBeenCalled()
        expect(prisma.address.update).not.toHaveBeenCalled()
    })
})

describe('PUT /api/users — credentials', () => {
    it('geeft 400 als email al in gebruik is', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'user-2' } as never)

        const res = await PUT(makeRequest({
            type: 'credentials',
            email: 'bezet@example.com',
        }))

        expect(res.status).toBe(400)
    })

    it('update email als niet in gebruik', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.user.update).mockResolvedValue({} as never)

        const res = await PUT(makeRequest({
            type: 'credentials',
            email: 'nieuw@example.com',
        }))

        expect(prisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ email: 'nieuw@example.com' }),
            })
        )
        expect(res.status).toBe(200)
    })

    it('hasht wachtwoord voor opslaan', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.user.update).mockResolvedValue({} as never)

        await PUT(makeRequest({
            type: 'credentials',
            password: 'nieuwWachtwoord123',
        }))

        expect(bcrypt.hash).toHaveBeenCalled()
    })
})