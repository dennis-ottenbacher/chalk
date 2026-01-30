'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database.types'
import { getOrganizationId } from '@/lib/get-organization'

type ProductType = Database['public']['Enums']['product_type']

export async function createProduct(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const type = formData.get('type') as ProductType
    const tax_rate = parseFloat(formData.get('tax_rate') as string) || 19.0
    const active = formData.get('active') === 'on'

    const organizationId = await getOrganizationId()

    const { error } = await supabase.from('products').insert({
        name,
        description,
        price,
        type,
        tax_rate,
        active,
        organization_id: organizationId,
    })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/products')
    redirect('/admin/products')
}

export async function updateProduct(id: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const type = formData.get('type') as ProductType
    const tax_rate = parseFloat(formData.get('tax_rate') as string)
    const active = formData.get('active') === 'on'

    const organizationId = await getOrganizationId()

    const { error } = await supabase
        .from('products')
        .update({
            name,
            description,
            price,
            type,
            tax_rate,
            active,
        })
        .eq('id', id)
        .eq('organization_id', organizationId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath(`/admin/products/${id}`)
    redirect('/admin/products')
}

export async function getActiveProducts() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .eq('organization_id', organizationId)
        .order('name')

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }

    return data
}
