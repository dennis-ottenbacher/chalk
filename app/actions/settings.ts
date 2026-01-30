'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getOrganizationId } from '@/lib/get-organization'

export type Settings = {
    id: string
    organization_id: string
    pos_direct_checkout: boolean
    company_name: string | null
    company_address: string | null
    company_zip: string | null
    company_city: string | null
    company_country: string | null
    company_tax_id: string | null
    company_vat_id: string | null
    voucher_validity_years: number
    voucher_validity_mode: 'exact_date' | 'year_end'
}

export async function getSettings(): Promise<Settings> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

    if (error) {
        console.error('Error fetching settings:', error)
        // Default fallback with correct type
        return {
            id: '',
            organization_id: organizationId,
            pos_direct_checkout: false,
            company_name: null,
            company_address: null,
            company_zip: null,
            company_city: null,
            company_country: 'DE',
            company_tax_id: null,
            company_vat_id: null,
            voucher_validity_years: 3,
            voucher_validity_mode: 'year_end',
        }
    }

    return data
}

export async function updateSettings(settings: Partial<Settings>) {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { error } = await supabase
        .from('settings')
        .update(settings)
        .eq('organization_id', organizationId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/settings')
    revalidatePath('/pos')
}
