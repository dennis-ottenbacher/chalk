import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import type { Database } from '@/types/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']

/**
 * Check if this is a marketing site request (www subdomain)
 */
export async function isMarketingSite(): Promise<boolean> {
    const headersList = await headers()
    return headersList.get('x-marketing-site') === 'true'
}

/**
 * Get the current organization context from request headers.
 * This should be called from Server Components or Server Actions.
 *
 * The organization is resolved by middleware based on the subdomain.
 *
 * @throws Error if organization context is not available
 */
export async function getOrganization(): Promise<Organization> {
    const headersList = await headers()
    const organizationId = headersList.get('x-organization-id')

    if (!organizationId) {
        throw new Error(
            'Organization context not available. Ensure middleware is configured correctly.'
        )
    }

    const supabase = await createClient()
    const { data: organization, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

    if (error || !organization) {
        throw new Error(`Organization not found: ${organizationId}`)
    }

    return organization
}

/**
 * Get the current organization context, or null if not available.
 * Use this for pages that may or may not have organization context (e.g., marketing pages).
 */
export async function getOrganizationOptional(): Promise<Organization | null> {
    const headersList = await headers()
    const organizationId = headersList.get('x-organization-id')

    if (!organizationId) {
        return null
    }

    const supabase = await createClient()
    const { data: organization, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

    if (error || !organization) {
        return null
    }

    return organization
}

/**
 * Get the organization ID from request headers.
 * Useful when you only need the ID and don't want to query the database.
 *
 * @throws Error if organization context is not available
 */
export async function getOrganizationId(): Promise<string> {
    const headersList = await headers()
    const organizationId = headersList.get('x-organization-id')

    if (!organizationId) {
        throw new Error(
            'Organization context not available. Ensure middleware is configured correctly.'
        )
    }

    return organizationId
}

/**
 * Get the organization slug from request headers.
 *
 * @throws Error if organization context is not available
 */
export async function getOrganizationSlug(): Promise<string> {
    const headersList = await headers()
    const organizationSlug = headersList.get('x-organization-slug')

    if (!organizationSlug) {
        throw new Error(
            'Organization context not available. Ensure middleware is configured correctly.'
        )
    }

    return organizationSlug
}
