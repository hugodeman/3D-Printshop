// api/orders/route.test.ts
import { GET } from './route'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
    default: { order: { findMany: vi.fn() } },
}))

describe('GET /api/orders', () => {
    it('geeft 401 terug als niet ingelogd', async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        vi.mocked(auth).mockResolvedValue(null)
        const res = await GET()
        expect(res.status).toBe(401)
    })

    it('geeft orders terug voor ingelogde gebruiker', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(prisma.order.findMany).mockResolvedValue([
            { id: 'order-1', status: 'PAID', total: '25.00', items: [] } as never,
        ])
        const res = await GET()
        const data = await res.json()
        expect(res.status).toBe(200)
        expect(data).toHaveLength(1)
        expect(data[0].id).toBe('order-1')
    })

    it('filtert alleen PAID en COMPLETED orders', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never)
        vi.mocked(prisma.order.findMany).mockResolvedValue([])
        await GET()
        expect(prisma.order.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: { in: ['PAID', 'COMPLETED'] },
                }),
            })
        )
    })
})