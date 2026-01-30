'use server'

import { createClient } from '@/utils/supabase/server'
import { CartItem } from '@/lib/store/cartStore'
import { getOrganizationId } from '@/lib/get-organization'

export type SavedCart = {
    id: string
    created_at: string
    name: string
    items: CartItem[]
    staff_id: string | null
}

export async function saveCart(name: string, items: CartItem[]) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const organizationId = await getOrganizationId()

    const { error } = await supabase.from('saved_carts').insert({
        name,
        items: JSON.stringify(items),
        staff_id: user.id, // Using user.id as staff_id directly for now as profiles might be tricky to join without generated types
        organization_id: organizationId,
    })

    if (error) {
        console.error('Error saving cart:', error)
        throw new Error('Failed to save cart')
    }
}

export async function getSavedCarts(): Promise<SavedCart[]> {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('saved_carts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching saved carts:', error)
        throw new Error('Failed to fetch saved carts')
    }

    // Parse items back to CartItem[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((cart: any) => ({
        ...cart,
        items: typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items,
    }))
}

export async function deleteSavedCart(id: string) {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { error } = await supabase
        .from('saved_carts')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)

    if (error) {
        console.error('Error deleting saved cart:', error)
        throw new Error('Failed to delete saved cart')
    }
}
