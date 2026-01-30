import { ProductForm } from '@/components/admin/product-form'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: product } = await supabase.from('products').select('*').eq('id', id).single()

    if (!product) {
        notFound()
    }

    return (
        <div className="flex justify-center">
            <ProductForm product={product} />
        </div>
    )
}
