'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'
import { revalidatePath } from 'next/cache'

export type LandingPage = {
    id: string
    organization_id: string
    slug: string
    title: string
    html_content: string
    is_published: boolean
    created_at: string
    updated_at: string
    created_by: string | null
}

export async function getLandingPages(): Promise<LandingPage[]> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching landing pages:', error)
        return []
    }

    return data || []
}

export async function getLandingPage(slug: string): Promise<LandingPage | null> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('slug', slug)
        .single()

    if (error) {
        console.error('Error fetching landing page:', error)
        return null
    }

    return data
}

export async function getPublicLandingPage(
    organizationId: string,
    slug: string
): Promise<LandingPage | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

    if (error) {
        console.error('Error fetching public landing page:', error)
        return null
    }

    return data
}

export async function createLandingPage(data: {
    title: string
    slug: string
    html_content: string
    is_published?: boolean
}): Promise<{ success: boolean; error?: string; landingPage?: LandingPage }> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data: user } = await supabase.auth.getUser()

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(data.slug)) {
        return {
            success: false,
            error: 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten',
        }
    }

    const { data: landingPage, error } = await supabase
        .from('landing_pages')
        .insert({
            organization_id: organizationId,
            title: data.title,
            slug: data.slug,
            html_content: data.html_content,
            is_published: data.is_published ?? false,
            created_by: user?.user?.id,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating landing page:', error)
        if (error.code === '23505') {
            return { success: false, error: 'Eine Seite mit diesem Slug existiert bereits' }
        }
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/landing-pages')
    return { success: true, landingPage }
}

export async function updateLandingPage(
    id: string,
    data: Partial<{
        title: string
        slug: string
        html_content: string
        is_published: boolean
    }>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    if (data.slug) {
        const slugRegex = /^[a-z0-9-]+$/
        if (!slugRegex.test(data.slug)) {
            return {
                success: false,
                error: 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten',
            }
        }
    }

    const { error } = await supabase
        .from('landing_pages')
        .update(data)
        .eq('id', id)
        .eq('organization_id', organizationId)

    if (error) {
        console.error('Error updating landing page:', error)
        if (error.code === '23505') {
            return { success: false, error: 'Eine Seite mit diesem Slug existiert bereits' }
        }
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/landing-pages')
    return { success: true }
}

export async function deleteLandingPage(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)

    if (error) {
        console.error('Error deleting landing page:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/landing-pages')
    return { success: true }
}

export async function publishLandingPage(
    id: string
): Promise<{ success: boolean; error?: string }> {
    return updateLandingPage(id, { is_published: true })
}

export async function unpublishLandingPage(
    id: string
): Promise<{ success: boolean; error?: string }> {
    return updateLandingPage(id, { is_published: false })
}

export async function getPreviewLandingPage(
    slug: string
): Promise<{ landingPage?: LandingPage; error?: string }> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // 1. Check if user is logged in
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Nicht angemeldet' }
    }

    // 2. Check permission
    const { hasPermission } = await import('@/lib/permissions')
    const canPreview = await hasPermission(user.id, 'landing_pages.preview', organizationId)

    if (!canPreview) {
        return { error: 'Keine Berechtigung zum Anzeigen von Entwürfen' }
    }

    // 3. Fetch landing page (regardless of is_published status)
    const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('slug', slug)
        .single()

    if (error || !data) {
        console.error('Error fetching preview landing page:', error)
        return { error: 'Seite nicht gefunden' }
    }

    return { landingPage: data }
}
