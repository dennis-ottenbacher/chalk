'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrganizationId } from '@/lib/get-organization'

const MemberSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'staff', 'member', 'athlete']).default('member'),
    member_id: z.string().optional(),
})

export type MemberFormState = {
    error?: string
    success?: boolean
}

async function checkAuth() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const organizationId = await getOrganizationId()

    // Check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .eq('organization_id', organizationId)
        .single()

    if (!profile || !['admin', 'staff'].includes(profile.role)) {
        return null
    }
    return user
}

export async function createMember(
    prevState: MemberFormState,
    formData: FormData
): Promise<MemberFormState> {
    const user = await checkAuth()
    if (!user) return { error: 'Unauthorized' }

    const rawData = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
        member_id: formData.get('member_id') || undefined,
    }

    const validatedFields = MemberSchema.safeParse(rawData)

    if (!validatedFields.success) {
        // return first error
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0]
        return { error: firstError || 'Validation failed' }
    }

    const { email, password, first_name, last_name, role, member_id } = validatedFields.data

    const adminSupabase = createAdminClient()

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    })

    if (authError) {
        return { error: authError.message }
    }

    if (!authData.user) {
        return { error: 'Failed to create user' }
    }

    const organizationId = await getOrganizationId()

    const { error: profileError } = await adminSupabase.from('profiles').insert({
        id: authData.user.id,
        first_name,
        last_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: role as any,
        member_id: member_id || null,
        organization_id: organizationId,
    })

    if (profileError) {
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
        return { error: 'Failed to create profile: ' + profileError.message }
    }

    revalidatePath('/members')
    return { success: true }
}

export async function toggleWaiver(userId: string, status: boolean) {
    const user = await checkAuth()
    if (!user) {
        throw new Error('Unauthorized')
    }

    const supabase = await createClient()

    const organizationId = await getOrganizationId()

    // Here we can use standard client because we added policy for staff to update profiles
    const { error } = await supabase
        .from('profiles')
        .update({ waiver_signed: status })
        .eq('id', userId)
        .eq('organization_id', organizationId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath(`/members/${userId}`)
    revalidatePath('/members')
}

export type MemberSearchResult = {
    id: string
    first_name: string | null
    last_name: string | null
    member_id: string | null
    birth_date: string | null
}

export async function searchMembers(query: string): Promise<MemberSearchResult[]> {
    if (!query || query.length < 2) return []

    const organizationId = await getOrganizationId()

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, member_id, birth_date')
        .eq('organization_id', organizationId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,member_id.ilike.%${query}%`)
        .limit(10)

    if (error) {
        console.error('Search members error:', error)
        return []
    }

    return data
}
