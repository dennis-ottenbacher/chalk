'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'
import { getTseManager, invalidateTseManager } from '@/lib/tse/tse-manager'
import { revalidatePath } from 'next/cache'

export interface TseConfigData {
    api_key: string
    api_secret: string
    tss_id: string
    client_id: string
    admin_pin?: string
    environment: 'sandbox' | 'production'
}

/**
 * Get TSE configuration for the current organization
 */
/**
 * Get TSE configuration for the current organization
 */
export async function getTseConfig() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('tse_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    if (error) {
        // If no config found, just return null (not an error necessarily)
        if (error.code === 'PGRST116') {
            return null
        }
        console.error('Failed to fetch TSE config:', error)
        return null
    }

    // Don't expose secrets to the client
    return {
        id: data.id,
        tss_id: data.tss_id,
        client_id: data.client_id,
        is_active: data.is_active,
        environment: data.environment,
        created_at: data.created_at,
        updated_at: data.updated_at,
        has_api_key: !!data.api_key,
        has_api_secret: !!data.api_secret,
        has_admin_pin: !!data.admin_pin,
    }
}

/**
 * Create or update TSE configuration
 */
export async function saveTseConfig(config: TseConfigData) {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Check if user is admin
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
        throw new Error('Not authenticated')
    }

    // Check if user is admin or manager using profiles table
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .eq('organization_id', organizationId)
        .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
        console.error('Permission denied. User role:', profile?.role)
        throw new Error('Only admins or managers can configure TSE')
    }

    // Check if config exists
    const { data: existingConfig } = await supabase
        .from('tse_configurations')
        .select('id')
        .eq('organization_id', organizationId)
        .single()

    if (existingConfig) {
        // Update existing
        const updateData: {
            tss_id: string
            client_id: string
            environment: 'sandbox' | 'production'
            is_active: boolean
            api_key?: string
            api_secret?: string
            admin_pin?: string
        } = {
            tss_id: config.tss_id,
            client_id: config.client_id,
            environment: config.environment,
            is_active: true,
        }

        // Only update secrets if they are changed (not masked)
        if (config.api_key && config.api_key !== '*****') {
            updateData.api_key = config.api_key
        }
        if (config.api_secret && config.api_secret !== '*****') {
            updateData.api_secret = config.api_secret
        }
        if (config.admin_pin && config.admin_pin !== '*****') {
            updateData.admin_pin = config.admin_pin
        }

        const { error } = await supabase
            .from('tse_configurations')
            .update(updateData)
            .eq('id', existingConfig.id)

        if (error) {
            console.error('Failed to update TSE config:', error)
            throw new Error('Failed to update TSE configuration')
        }
    } else {
        // Create new
        const { error } = await supabase.from('tse_configurations').insert({
            organization_id: organizationId,
            api_key: config.api_key,
            api_secret: config.api_secret,
            tss_id: config.tss_id,
            client_id: config.client_id,
            admin_pin: config.admin_pin,
            environment: config.environment,
            is_active: true,
        })

        if (error) {
            console.error('Failed to create TSE config:', error)
            throw new Error('Failed to create TSE configuration')
        }
    }

    invalidateTseManager(organizationId)
    revalidatePath('/admin/settings')
    return { success: true }
}

/**
 * Test TSE connection
 */
export async function testTseConnection() {
    const organizationId = await getOrganizationId()

    try {
        const tseManager = await getTseManager(organizationId)

        if (!tseManager.isEnabled()) {
            return { success: false, message: 'TSE not configured' }
        }

        // The manager already does a health check during initialization
        return { success: true, message: 'TSE connection successful' }
    } catch (error) {
        console.error('TSE connection test failed:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Connection failed',
        }
    }
}

/**
 * Deactivate TSE
 */
export async function deactivateTse() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { error } = await supabase
        .from('tse_configurations')
        .update({ is_active: false })
        .eq('organization_id', organizationId)

    if (error) {
        console.error('Failed to deactivate TSE:', error)
        throw new Error('Failed to deactivate TSE')
    }

    invalidateTseManager(organizationId)
    revalidatePath('/admin/settings')
    return { success: true }
}

/**
 * Export DSFinV-K data for tax audit
 */
export async function exportDSFinVK(startDate: string, endDate: string) {
    const organizationId = await getOrganizationId()

    try {
        const tseManager = await getTseManager(organizationId)

        if (!tseManager.isEnabled()) {
            throw new Error('TSE not configured')
        }

        const blob = await tseManager.exportDSFinVK(new Date(startDate), new Date(endDate))

        if (!blob) {
            throw new Error('Export failed')
        }

        // Convert blob to base64 for transfer
        const buffer = await blob.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')

        return {
            success: true,
            data: base64,
            filename: `dsfinvk_${startDate}_${endDate}.tar`,
        }
    } catch (error) {
        console.error('DSFinV-K export failed:', error)
        throw error
    }
}

/**
 * Get TSS status from Fiskaly API
 */
export async function getTssStatus() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Get config from database
    const { data: config } = await supabase
        .from('tse_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    if (!config) {
        return { configured: false }
    }

    try {
        const axios = (await import('axios')).default
        const baseUrl =
            config.environment === 'sandbox'
                ? 'https://kassensichv-middleware.fiskaly.com/api/v2'
                : 'https://kassensichv-middleware.fiskaly.com/api/v2'

        // Get auth token
        const authResponse = await axios.post(`${baseUrl}/auth`, {
            api_key: config.api_key,
            api_secret: config.api_secret,
        })
        const token = authResponse.data.access_token

        // Get TSS info
        const tssResponse = await axios.get(`${baseUrl}/tss/${config.tss_id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })

        // Check client registration
        let clientRegistered = false
        try {
            await axios.get(`${baseUrl}/tss/${config.tss_id}/client/${config.client_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            clientRegistered = true
        } catch {
            clientRegistered = false
        }

        return {
            configured: true,
            tssState: tssResponse.data.state,
            clientRegistered,
            environment: config.environment,
            tssId: config.tss_id,
            clientId: config.client_id,
        }
    } catch (error) {
        console.error('Failed to get TSS status:', error)
        return {
            configured: true,
            error: error instanceof Error ? error.message : 'Failed to fetch status',
        }
    }
}

/**
 * Initialize TSS through Fiskaly API
 */
export async function initializeTss(): Promise<{ success: boolean; logs: string[] }> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()
    const logs: string[] = []

    // Get config from database
    const { data: config } = await supabase
        .from('tse_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    if (!config) {
        return { success: false, logs: ['❌ TSE nicht konfiguriert'] }
    }

    try {
        const axios = (await import('axios')).default
        const baseUrl =
            config.environment === 'sandbox'
                ? 'https://kassensichv-middleware.fiskaly.com/api/v2'
                : 'https://kassensichv-middleware.fiskaly.com/api/v2'

        // Step 1: Authenticate
        logs.push('🔐 Authentifizierung...')
        const authResponse = await axios.post(`${baseUrl}/auth`, {
            api_key: config.api_key,
            api_secret: config.api_secret,
        })
        const token = authResponse.data.access_token
        logs.push('✅ Authentifizierung erfolgreich')

        // Step 2: Check current TSS state
        logs.push('📊 Prüfe TSS Status...')
        const tssResponse = await axios.get(`${baseUrl}/tss/${config.tss_id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        let tssState = tssResponse.data.state
        logs.push(`   Status: ${tssState}`)

        // Step 3: Handle state transitions
        if (tssState === 'CREATED') {
            logs.push('⚙️ Wechsel zu UNINITIALIZED...')
            await axios.patch(
                `${baseUrl}/tss/${config.tss_id}`,
                { state: 'UNINITIALIZED' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            tssState = 'UNINITIALIZED'
            logs.push('✅ Status: UNINITIALIZED')
        }

        if (tssState === 'UNINITIALIZED') {
            // Admin authentication required
            if (!config.admin_pin) {
                return {
                    success: false,
                    logs: [...logs, '❌ Admin PIN fehlt! Bitte in den Einstellungen hinterlegen.'],
                }
            }

            logs.push('🔑 Admin Authentifizierung...')
            await axios.post(
                `${baseUrl}/tss/${config.tss_id}/admin/auth`,
                { admin_pin: config.admin_pin },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            logs.push('✅ Admin authentifiziert')

            logs.push('🚀 Initialisiere TSS...')
            await axios.patch(
                `${baseUrl}/tss/${config.tss_id}`,
                { state: 'INITIALIZED' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            // Wait for initialization
            logs.push('⏳ Warte auf Initialisierung...')
            for (let i = 0; i < 10; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                const checkResponse = await axios.get(`${baseUrl}/tss/${config.tss_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                tssState = checkResponse.data.state
                if (tssState === 'INITIALIZED') break
            }

            if (tssState !== 'INITIALIZED') {
                return {
                    success: false,
                    logs: [...logs, `❌ Initialisierung fehlgeschlagen. Status: ${tssState}`],
                }
            }
            logs.push('✅ TSS initialisiert')
        }

        // Step 4: Register client
        logs.push('📝 Registriere Client...')
        try {
            await axios.put(
                `${baseUrl}/tss/${config.tss_id}/client/${config.client_id}`,
                { serial_number: config.client_id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            logs.push('✅ Client registriert')
        } catch {
            logs.push('ℹ️ Client bereits registriert')
        }

        logs.push('')
        logs.push('🎉 TSS erfolgreich initialisiert!')

        invalidateTseManager(organizationId)
        revalidatePath('/admin/settings')

        return { success: true, logs }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
        logs.push(`❌ Fehler: ${message}`)
        return { success: false, logs }
    }
}

/**
 * Disable TSS through Fiskaly API
 */
export async function disableTss(): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Get config from database
    const { data: config } = await supabase
        .from('tse_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    if (!config) {
        return { success: false, message: 'TSE nicht konfiguriert' }
    }

    try {
        const axios = (await import('axios')).default
        const baseUrl =
            config.environment === 'sandbox'
                ? 'https://kassensichv-middleware.fiskaly.com/api/v2'
                : 'https://kassensichv-middleware.fiskaly.com/api/v2'

        // Authenticate
        const authResponse = await axios.post(`${baseUrl}/auth`, {
            api_key: config.api_key,
            api_secret: config.api_secret,
        })
        const token = authResponse.data.access_token

        // Admin authentication
        if (!config.admin_pin) {
            return { success: false, message: 'Admin PIN fehlt' }
        }

        await axios.post(
            `${baseUrl}/tss/${config.tss_id}/admin/auth`,
            { admin_pin: config.admin_pin },
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        )

        // Disable TSS
        await axios.patch(
            `${baseUrl}/tss/${config.tss_id}`,
            { state: 'DISABLED' },
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        )

        // Update local database
        await supabase
            .from('tse_configurations')
            .update({ is_active: false })
            .eq('organization_id', organizationId)

        invalidateTseManager(organizationId)
        revalidatePath('/admin/settings')

        return { success: true, message: 'TSS erfolgreich deaktiviert' }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
        return { success: false, message }
    }
}
