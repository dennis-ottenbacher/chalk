'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'
import { revalidatePath } from 'next/cache'
import { clearPaymentManagerCache } from '@/lib/payments'

/**
 * Get payment configuration for the current organization
 */
export async function getPaymentConfig() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data: config } = await supabase
        .from('payment_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    if (!config) {
        return {
            cardProvider: 'standalone' as const,
            mollieApiKey: null,
            mollieTestMode: true,
            mollieEnabled: false,
        }
    }

    return {
        cardProvider: config.card_provider as 'standalone' | 'mollie',
        // Mask the API key for display
        mollieApiKey: config.mollie_api_key ? '*****' : null,
        mollieTestMode: config.mollie_test_mode,
        mollieEnabled: config.mollie_enabled,
    }
}

/**
 * Update payment configuration
 */
export async function updatePaymentConfig(data: {
    cardProvider?: 'standalone' | 'mollie'
    mollieApiKey?: string
    mollieTestMode?: boolean
    mollieEnabled?: boolean
}) {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Prepare update data
    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    }

    if (data.cardProvider !== undefined) {
        updateData.card_provider = data.cardProvider
    }
    if (data.mollieApiKey !== undefined && data.mollieApiKey !== '*****') {
        updateData.mollie_api_key = data.mollieApiKey || null
    }
    if (data.mollieTestMode !== undefined) {
        updateData.mollie_test_mode = data.mollieTestMode
    }
    if (data.mollieEnabled !== undefined) {
        updateData.mollie_enabled = data.mollieEnabled
    }

    // Check if config exists
    const { data: existingConfig } = await supabase
        .from('payment_configurations')
        .select('id')
        .eq('organization_id', organizationId)
        .single()

    if (existingConfig) {
        // Update existing
        const { error } = await supabase
            .from('payment_configurations')
            .update(updateData)
            .eq('organization_id', organizationId)

        if (error) {
            console.error('Failed to update payment config:', error)
            throw new Error('Failed to update payment configuration')
        }
    } else {
        // Create new
        const { error } = await supabase.from('payment_configurations').insert({
            organization_id: organizationId,
            ...updateData,
        })

        if (error) {
            console.error('Failed to create payment config:', error)
            throw new Error('Failed to create payment configuration')
        }
    }

    // Clear cache
    clearPaymentManagerCache(organizationId)

    revalidatePath('/admin/settings')
    return { success: true }
}

/**
 * Get the webhook URL for the current organization
 */
export async function getWebhookUrl() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Get organization slug for subdomain
    const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', organizationId)
        .single()

    if (!org) {
        return null
    }

    // Construct webhook URL using the organization's subdomain
    // In production: https://{slug}.chalk.com/api/webhooks/mollie
    // In development: Will need ngrok or similar
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chalk.com'
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction) {
        // Extract base domain from NEXT_PUBLIC_SITE_URL
        const url = new URL(baseUrl)
        const domain = url.hostname.split('.').slice(-2).join('.')
        return `https://${org.slug}.${domain}/api/webhooks/mollie`
    }

    // Development mode - show placeholder
    return `https://${org.slug}.localhost:3000/api/webhooks/mollie`
}
