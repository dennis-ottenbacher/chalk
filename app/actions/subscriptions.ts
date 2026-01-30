'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getOrganizationId } from '@/lib/get-organization'

async function checkAuth() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const organizationId = await getOrganizationId()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .eq('organization_id', organizationId)
        .single()

    if (!profile || !['admin', 'staff'].includes(profile.role)) {
        return null
    }
    return true
}

export async function createSubscription(userId: string, formData: FormData) {
    const isAuth = await checkAuth()
    if (!isAuth) throw new Error('Unauthorized')

    const supabase = await createClient()

    // We expect: product_id
    const productId = formData.get('product_id') as string
    if (!productId) throw new Error('Product is required')

    const organizationId = await getOrganizationId()

    // Fetch product details to calculate end_date or credits
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('organization_id', organizationId)
        .single()

    if (!product) throw new Error('Product not found')

    const startDate = new Date()
    let endDate = null
    let remaining_entries = null

    // Time-based logic
    if (product.duration_months) {
        endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + product.duration_months)
    }

    // Credits/Entries logic (e.g. 11er Karte)
    if (product.credits_amount) {
        remaining_entries = product.credits_amount
    }

    const { error } = await supabase.from('subscriptions').insert({
        user_id: userId,
        product_id: productId,
        start_date: startDate.toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        remaining_entries: remaining_entries,
        is_active: true,
        organization_id: organizationId,
    })

    if (error) throw new Error(error.message)

    revalidatePath(`/members/${userId}`)
}

export async function cancelSubscription(subscriptionId: string, userId: string) {
    const isAuth = await checkAuth()
    if (!isAuth) throw new Error('Unauthorized')

    const supabase = await createClient()

    const organizationId = await getOrganizationId()

    const { error } = await supabase
        .from('subscriptions')
        .update({ is_active: false })
        .eq('id', subscriptionId)
        .eq('organization_id', organizationId)

    if (error) throw new Error(error.message)
    revalidatePath(`/members/${userId}`)
}
