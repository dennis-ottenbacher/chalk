'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getOrganizationId } from '@/lib/get-organization'
import { getSettings } from './settings'
import { calculateVoucherExpiry } from '@/lib/voucher-validity'

export type TransactionItem = {
    id: string
    name: string
    price: number
    quantity: number
    type?: string
    duration_months?: number | null
    recurring_interval?: string | null
    credits_amount?: number | null
    member_id?: string | null
    voucher_code?: string
}

export type Transaction = {
    id: string
    created_at: string
    total_amount: number
    payment_method: 'cash' | 'card' | 'voucher'
    status: 'completed' | 'cancelled' | 'refunded'
    items: TransactionItem[]
    staff_id?: string
    member_id?: string | null
}

export async function createTransaction(data: {
    items: TransactionItem[]
    totalAmount: number
    paymentMethod: 'cash' | 'card' | 'voucher'
    memberId?: string | null
    voucherCode?: string
    appliedVoucher?: {
        code: string
        amount: number
    }
}) {
    const supabase = await createClient()

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw new Error('Not authenticated')

    const organizationId = await getOrganizationId()

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', userData.user.id)
        .single()

    if (!profile) {
        throw new Error('Profile not found for user')
    }

    if (profile.organization_id !== organizationId) {
        throw new Error(
            `Organization Mismatch: Request Org (${organizationId}) does not match Profile Org (${profile.organization_id}). Check your tenant implementation.`
        )
    }

    if (data.appliedVoucher) {
        const { data: voucher, error: voucherFetchError } = await supabase
            .from('vouchers')
            .select('*')
            .eq('code', data.appliedVoucher.code)
            .eq('organization_id', organizationId)
            .single()

        if (voucherFetchError || !voucher) {
            throw new Error('Invalid applied voucher')
        }

        if (voucher.status !== 'active') {
            throw new Error('Applied voucher is not active')
        }

        if (voucher.remaining_amount < data.appliedVoucher.amount) {
            throw new Error(
                `Insufficient voucher balance for discount (Remaining: €${voucher.remaining_amount.toFixed(2)})`
            )
        }

        const newBalance = voucher.remaining_amount - data.appliedVoucher.amount
        const newStatus = newBalance <= 0 ? 'redeemed' : 'active'

        const { error: voucherUpdateError } = await supabase
            .from('vouchers')
            .update({
                remaining_amount: newBalance,
                status: newStatus,
            })
            .eq('id', voucher.id)

        if (voucherUpdateError) {
            throw new Error('Failed to process voucher discount')
        }
    }

    if (data.paymentMethod === 'voucher') {
        if (!data.voucherCode) {
            throw new Error('Voucher code is required for voucher payment')
        }

        const { data: voucher, error: voucherFetchError } = await supabase
            .from('vouchers')
            .select('*')
            .eq('code', data.voucherCode)
            .eq('organization_id', organizationId)
            .single()

        if (voucherFetchError || !voucher) {
            throw new Error('Invalid voucher provided')
        }

        if (voucher.status !== 'active') {
            throw new Error('Voucher is not active')
        }

        if (voucher.remaining_amount < data.totalAmount) {
            throw new Error(
                `Insufficient voucher balance (Remaining: €${voucher.remaining_amount.toFixed(2)})`
            )
        }

        const newBalance = voucher.remaining_amount - data.totalAmount
        const newStatus = newBalance <= 0 ? 'redeemed' : 'active'

        const { error: voucherUpdateError } = await supabase
            .from('vouchers')
            .update({
                remaining_amount: newBalance,
                status: newStatus,
            })
            .eq('id', voucher.id)

        if (voucherUpdateError) {
            throw new Error('Failed to process voucher payment')
        }
    }

    // 1. Create Transaction Record (without TSE data initially)
    const { data: transactionData, error } = await supabase
        .from('transactions')
        .insert({
            items: data.items,
            total_amount: data.totalAmount,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payment_method: data.paymentMethod as any, // Cast to any to bypass potential TS enum check if generated types haven't updated
            staff_id: userData.user.id,
            member_id: data.memberId || null,
            status: 'completed',
            organization_id: organizationId,
        })
        .select()
        .single()

    if (error || !transactionData) {
        console.error('Transaction error:', error)
        throw new Error(
            `Failed to create transaction: ${error?.message || 'Unknown error'} (Code: ${error?.code}, Details: ${error?.details})`
        )
    }

    // 2. Sign transaction with TSE (if enabled)
    try {
        console.log('[TSE] Attempting to sign transaction:', transactionData.id)
        const { getTseManager } = await import('@/lib/tse/tse-manager')
        const tseManager = await getTseManager(organizationId)

        if (tseManager.isEnabled()) {
            console.log('[TSE] Manager is enabled, signing...')
            const tseSignature = await tseManager.signTransaction(
                transactionData.id,
                data.totalAmount,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.paymentMethod as any,
                data.items.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    vat_rate: 19, // Default German VAT rate, could be made configurable
                }))
            )

            if (tseSignature) {
                // Update transaction with TSE signature data
                await supabase
                    .from('transactions')
                    .update({ tse_data: tseSignature })
                    .eq('id', transactionData.id)

                console.log(
                    '[TSE] Transaction signed successfully:',
                    tseSignature.transaction_number
                )
            } else {
                console.warn('[TSE] Signing returned null (failed silently?)')
            }
        } else {
            console.log(
                '[TSE] Manager is NOT enabled. Skipping signing. Config exists:',
                !!tseManager.getConfig()
            )
        }
    } catch (tseError) {
        // TSE errors should not prevent transaction completion
        console.error('[TSE] Signing failed with error:', tseError)
    }

    // 2. Process Subscriptions and Packs based on item assignments
    for (const item of data.items) {
        const targetMemberId = item.member_id || data.memberId
        if (targetMemberId) {
            if (item.type === 'plan') {
                // Calculate dates
                const startDate = new Date()
                let endDate = null

                if (item.duration_months) {
                    endDate = new Date(startDate)
                    endDate.setMonth(endDate.getMonth() + item.duration_months)
                }

                const { error: subError } = await supabase.from('subscriptions').insert({
                    user_id: targetMemberId,
                    product_id: item.id,
                    start_date: startDate.toISOString(),
                    end_date: endDate ? endDate.toISOString() : null,
                    is_active: true,
                    remaining_entries: null,
                    organization_id: organizationId,
                })

                if (subError) console.error('Failed to create subscription:', subError)
            }

            if (item.type === 'entry' && item.credits_amount) {
                const { error: subError } = await supabase.from('subscriptions').insert({
                    user_id: targetMemberId,
                    product_id: item.id,
                    start_date: new Date().toISOString(),
                    end_date: null,
                    is_active: true,
                    remaining_entries: item.credits_amount * item.quantity,
                    organization_id: organizationId,
                })
                if (subError) console.error('Failed to create entry pack:', subError)
            }
        }

        if (item.type === 'voucher') {
            // Fetch organization settings for voucher validity
            const settings = await getSettings()
            const purchaseDate = new Date()
            const expiryDate = calculateVoucherExpiry(
                purchaseDate,
                settings.voucher_validity_years,
                settings.voucher_validity_mode
            )

            for (let i = 0; i < item.quantity; i++) {
                // Use provided code if available (only for first item if quantity > 1 to avoid conflicts, or maybe we shouldn't allow quantity > 1 with custom code?)
                // For simplicity: if code is provided, use it. If duplicates, DB constraint will fail, which is correct behavior.
                const code =
                    item.voucher_code && i === 0
                        ? item.voucher_code
                        : `V-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

                const { error: voucherError } = await supabase.from('vouchers').insert({
                    code,
                    initial_amount: item.price,
                    remaining_amount: item.price,
                    status: 'active',
                    transaction_id: transactionData.id,
                    expires_at: expiryDate.toISOString(),
                    organization_id: organizationId,
                })

                if (voucherError) console.error('Failed to create voucher:', voucherError)
            }
        }
    }

    revalidatePath('/pos')
    return { success: true }
}

export async function getRecentTransactions() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Fetch transactions error:', error)
        return []
    }

    return data as unknown as Transaction[]
}

export async function cancelTransaction(id: string) {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { error } = await supabase
        .from('transactions')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('organization_id', organizationId)

    if (error) {
        console.error('Cancel transaction error:', error)
        throw new Error('Failed to cancel transaction')
    }

    revalidatePath('/pos')
    return { success: true }
}
