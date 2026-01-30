'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    try {
        const { error } = await supabase.auth.signInWithPassword(data)

        if (error) {
            console.error('Login error:', error)
            return redirect('/login?error=' + encodeURIComponent(error.message))
        }

        const {
            data: { user },
        } = await supabase.auth.getUser()

        let redirectPath = '/'
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'admin' || profile?.role === 'manager') {
                redirectPath = '/admin'
            } else if (profile?.role === 'staff') {
                redirectPath = '/pos'
            }
        }

        revalidatePath(redirectPath, 'layout')
        return redirect(redirectPath)
    } catch (e) {
        // Catch network/connection errors (e.g., Supabase down)
        if (
            e instanceof Error &&
            (e.message.includes('fetch failed') || e.message.includes('connection error'))
        ) {
            return redirect('/login?error=backend_unavailable')
        }
        // Re-throw redirect errors (NEXT_REDIRECT)
        if ((e as Error).message === 'NEXT_REDIRECT') {
            throw e
        }
        // Fallback for other errors
        if (e instanceof Error) {
            return redirect('/login?error=' + encodeURIComponent(e.message))
        }
    }

    revalidatePath('/', 'layout')
    return redirect('/')
}
