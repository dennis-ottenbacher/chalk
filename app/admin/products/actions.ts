'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const type = formData.get('type') as 'product' | 'plan'
    const tax_rate = parseFloat(formData.get('tax_rate') as string) || 19.0
    const duration_months = formData.get('duration_months')
        ? parseInt(formData.get('duration_months') as string)
        : null
    const credits_amount = formData.get('credits_amount')
        ? parseInt(formData.get('credits_amount') as string)
        : null
    const recurring_interval = (formData.get('recurring_interval') as string) || null

    const { error } = await supabase.from('products').insert({
        name,
        description,
        price,
        type,
        tax_rate,
        duration_months,
        credits_amount,
        recurring_interval,
        active: true,
    })

    if (error) {
        console.error('Error creating product:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/products')
    redirect('/admin/products')
}

export async function updateProduct(id: string, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const type = formData.get('type') as 'product' | 'plan'
    const tax_rate = parseFloat(formData.get('tax_rate') as string)
    const active = formData.get('active') === 'on'
    const duration_months = formData.get('duration_months')
        ? parseInt(formData.get('duration_months') as string)
        : null
    const credits_amount = formData.get('credits_amount')
        ? parseInt(formData.get('credits_amount') as string)
        : null
    const recurring_interval = (formData.get('recurring_interval') as string) || null

    const { error } = await supabase
        .from('products')
        .update({
            name,
            description,
            price,
            type,
            tax_rate,
            active,
            duration_months,
            credits_amount,
            recurring_interval,
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating product:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/products')
    redirect('/admin/products')
}

export async function deleteProduct(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
        console.error('Error deleting product:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/products')
}
