'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationId } from '@/lib/get-organization'

export type VoucherValidationResult = {
    valid: boolean
    message?: string
    voucher?: {
        id: string
        code: string
        remaining_amount: number
        status: string
        expires_at: string | null
    }
}

export async function validateVoucher(code: string): Promise<VoucherValidationResult> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Clean up code input (trim whitespace, maybe uppercase if standard is uppercase)
    const normalizedCode = code.trim().toUpperCase()

    const { data, error } = await supabase
        .from('vouchers')
        .select('id, code, remaining_amount, status, expires_at')
        .eq('code', normalizedCode)
        .eq('organization_id', organizationId)
        .maybeSingle()

    if (error) {
        console.error('Voucher lookup error:', error)
        return { valid: false, message: 'Error looking up voucher' }
    }

    if (!data) {
        return { valid: false, message: 'Voucher not found' }
    }

    if (data.status !== 'active') {
        return { valid: false, message: `Voucher is ${data.status}` }
    }

    if (data.remaining_amount <= 0) {
        return { valid: false, message: 'Voucher has no remaining balance' }
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false, message: 'Voucher has expired' }
    }

    return { valid: true, voucher: data }
}
