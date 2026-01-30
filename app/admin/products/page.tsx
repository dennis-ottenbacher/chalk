import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'

export default async function ProductsPage() {
    const supabase = await createClient()
    const { data: products, error } = await supabase.from('products').select('*').order('name')

    if (error) {
        return <div>Error loading products</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                <Button asChild>
                    <Link href="/admin/products/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-white">
                <DataTable
                    columns={columns}
                    data={products}
                    filterColumn="name"
                    filterPlaceholder="Search products..."
                />
            </div>
        </div>
    )
}
