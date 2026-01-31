'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database.types'
import { useCartStore } from '@/lib/store/cartStore'
import { Plus } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']

interface ProductCardProps {
    product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore(state => state.addItem)

    return (
        <Card className="flex flex-col h-full bg-card border-border text-foreground shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-4 flex-grow">
                <CardTitle className="text-lg font-bold leading-tight">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {product.description}
                </p>
            </CardHeader>
            <CardContent className="p-4 py-2">
                <div className="text-xl font-bold text-success">€{product.price.toFixed(2)}</div>
            </CardContent>
            <CardFooter className="p-4 pt-2">
                {/* POS: Large touch target h-12 */}
                <Button className="w-full h-12 text-lg" onClick={() => addItem(product)}>
                    <Plus className="mr-2 h-5 w-5" /> Add
                </Button>
            </CardFooter>
        </Card>
    )
}
