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
        <Card className="flex flex-col h-full bg-white border-gray-200 text-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="p-4 flex-grow">
                <CardTitle className="text-lg font-bold leading-tight">{product.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
            </CardHeader>
            <CardContent className="p-4 py-2">
                <div className="text-xl font-bold text-emerald-600">
                    €{product.price.toFixed(2)}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-2">
                <Button
                    className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => addItem(product)}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
            </CardFooter>
        </Card>
    )
}
