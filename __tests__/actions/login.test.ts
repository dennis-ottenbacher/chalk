import { describe, test, expect, vi, beforeEach } from 'vitest'
import { login } from '@/app/login/actions'
import * as navigation from 'next/navigation'
import * as cache from 'next/cache'

// Mock dependencies
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

const mockSignInWithPassword = vi.fn()
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

const mockCreateClient = vi.fn(() => ({
    auth: {
        signInWithPassword: mockSignInWithPassword,
        getUser: mockGetUser,
    },
    from: mockFrom,
}))

vi.mock('@/utils/supabase/server', () => ({
    createClient: () => mockCreateClient(), // return the mocked client
}))

describe('login action', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('redirects to home on successful login', async () => {
        mockSignInWithPassword.mockResolvedValue({ error: null })
        mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
        mockFrom.mockReturnValue({ select: mockSelect })
        mockSelect.mockReturnValue({ eq: mockEq })
        mockEq.mockReturnValue({ single: mockSingle })
        mockSingle.mockResolvedValue({ data: { role: 'admin' } })

        const formData = new FormData()
        formData.append('email', 'test@example.com')
        formData.append('password', 'password123')

        // Since login calls redirect, and redirect typically throws an error in Next.js (NEXT_REDIRECT),
        // we might need to catch it or the mock just returns undefined/void.
        // In our mock it's a spy suitable for checking calls.
        // However, the action implementation re-throws 'NEXT_REDIRECT'.
        // If our mock doesn't throw, execution continues.

        // The real redirect throws "NEXT_REDIRECT".
        // We can simulate this if we want to test the throw, or just check if it was called.
        // In the action:
        // ...
        // revalidatePath('/admin', 'layout')
        // redirect('/admin')

        // So if auth is successful:
        try {
            await login(formData)
        } catch (e) {
            // redirect might throw, but our mock defaults to return undefined
        }

        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        })
        expect(cache.revalidatePath).toHaveBeenCalledWith('/admin', 'layout')
        expect(navigation.redirect).toHaveBeenCalledWith('/admin')
    })

    test('redirects with error parameter on login failure', async () => {
        mockSignInWithPassword.mockResolvedValue({
            error: { message: 'Invalid credentials' },
        })

        const formData = new FormData()
        formData.append('email', 'wrong@example.com')
        formData.append('password', 'wrong')

        await login(formData)

        expect(navigation.redirect).toHaveBeenCalledWith('/login?error=Invalid%20credentials')
        // Should NOT reach success redirects
        expect(cache.revalidatePath).not.toHaveBeenCalled()
        // It calls redirect early
    })

    test('handles network errors', async () => {
        mockSignInWithPassword.mockRejectedValue(new Error('fetch failed'))

        const formData = new FormData()
        formData.append('email', 'test@example.com')
        formData.append('password', 'pass')

        await login(formData)

        expect(navigation.redirect).toHaveBeenCalledWith('/login?error=backend_unavailable')
    })
})
