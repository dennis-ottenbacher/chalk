'use client'

import { useState } from 'react'
import { Database } from '@/types/database.types'
import ProductCard from './ProductCard'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Product = Database['public']['Tables']['products']['Row']
type ProductType = Database['public']['Enums']['product_type'] | 'all'

interface ProductGridProps {
    products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<ProductType>('all')

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || product.type === selectedCategory
        return matchesSearch && matchesCategory
    })

    const categories: { label: string; value: ProductType }[] = [
        { label: 'All', value: 'all' },
        { label: 'Goods', value: 'goods' },
        { label: 'Entries', value: 'entry' },
        { label: 'Rentals', value: 'rental' },
        { label: 'Vouchers', value: 'voucher' },
        { label: 'Plans', value: 'plan' },
    ]

    return (
        <div className="flex flex-col h-full gap-4 p-4 text-foreground">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-8 bg-muted border-border text-foreground placeholder:text-muted-foreground"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 bg-muted p-1 rounded-md overflow-x-auto max-w-full border border-border">
                    {categories.map(cat => (
                        <Button
                            key={cat.value}
                            variant={selectedCategory === cat.value ? 'secondary' : 'ghost'}
                            className={`${selectedCategory === cat.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent'} whitespace-nowrap`}
                            onClick={() => setSelectedCategory(cat.value)}
                            size="sm"
                        >
                            {cat.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pr-2 pb-20">
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No products found.
                    </div>
                )}
            </div>
        </div>
    )
}
