import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createClient } from '@/utils/supabase/server'

/**
 * Parse subdomain from hostname
 * Examples:
 * - localhost -> null (use default)
 * - www.localhost -> 'www' (marketing site)
 * - gym-a.localhost -> 'gym-a'
 * - www.chalk.com -> 'www' (marketing site)
 * - gym-a.chalk.com -> 'gym-a'
 * - chalk.com -> null (main site)
 */
function getSubdomain(hostname: string): string | null {
    // Remove port if present
    const host = hostname.split(':')[0]

    // For localhost, check for subdomain pattern
    if (host === 'localhost' || host === '127.0.0.1') {
        return null // Use default organization
    }

    // For subdomain.localhost pattern
    if (host.endsWith('.localhost')) {
        const subdomain = host.replace('.localhost', '')
        return subdomain || null
    }

    // For production domains (e.g., gym-a.chalk.com)
    const parts = host.split('.')

    // If only domain.tld (e.g., chalk.com), no subdomain
    if (parts.length <= 2) {
        return null
    }

    // Return first part as subdomain
    return parts[0]
}

/**
 * Check if this is a marketing subdomain (www)
 */
function isMarketingSubdomain(subdomain: string | null): boolean {
    return subdomain === 'www'
}

export async function middleware(request: NextRequest) {
    // 1. Parse subdomain
    const hostname = request.headers.get('host') || ''
    const subdomain = getSubdomain(hostname)

    // 2. Check for marketing subdomain (www) - skip tenant resolution
    if (isMarketingSubdomain(subdomain)) {
        const response = await updateSession(request, {
            skipAuth: true,
            customHeaders: { 'x-marketing-site': 'true' },
        })
        return response
    }

    // 3. Resolve organization for tenant subdomains
    const supabase = await createClient()
    let organizationId: string
    let organizationSlug: string

    if (subdomain) {
        // Look up organization by subdomain
        const { data: organization, error } = await supabase
            .from('organizations')
            .select('id, slug')
            .eq('slug', subdomain)
            .single()

        if (error || !organization) {
            // Invalid subdomain - redirect to main site or show error
            // For now, fall back to default organization
            organizationId = '00000000-0000-0000-0000-000000000001'
            organizationSlug = 'demo'
        } else {
            organizationId = organization.id
            organizationSlug = organization.slug
        }
    } else {
        // No subdomain - use default organization
        organizationId = '00000000-0000-0000-0000-000000000001'
        organizationSlug = 'demo'
    }

    // 4. Update Supabase session
    const response = await updateSession(request)

    // 5. Set organization context headers
    response.headers.set('x-organization-id', organizationId)
    response.headers.set('x-organization-slug', organizationSlug)

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
