'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createProduct, updateProduct } from '@/app/admin/products/actions'
import { useRouter } from 'next/navigation'

interface ProductFormProps {
    product?: {
        id: string
        name: string
        description: string
        price: number
        type: string
        tax_rate: number
        active: boolean
        duration_months?: number | null
        credits_amount?: number | null
        recurring_interval?: string | null
    }
}

export function ProductForm({ product }: ProductFormProps) {
    const router = useRouter()
    const [selectedType, setSelectedType] = useState(product?.type || 'goods')

    async function handleSubmit(formData: FormData) {
        if (product) {
            await updateProduct(product.id, formData)
        } else {
            await createProduct(formData)
        }
    }

    return (
        <Card className="w-[600px]">
            <CardHeader>
                <CardTitle>{product ? 'Edit Product' : 'Create Product'}</CardTitle>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Name
                        </label>
                        <Input id="name" name="name" defaultValue={product?.name} required />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description
                        </label>
                        <Input
                            id="description"
                            name="description"
                            defaultValue={product?.description}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="price" className="text-sm font-medium">
                                Price (Brutto)
                            </label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                defaultValue={product?.price}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="tax_rate" className="text-sm font-medium">
                                Tax Rate (%)
                            </label>
                            <Input
                                id="tax_rate"
                                name="tax_rate"
                                type="number"
                                step="0.1"
                                defaultValue={product?.tax_rate || 19.0}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="type" className="text-sm font-medium">
                            Type
                        </label>
                        <select
                            id="type"
                            name="type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                        >
                            <option value="goods">Goods</option>
                            <option value="entry">Entry</option>
                            <option value="rental">Rental</option>
                            <option value="voucher">Voucher</option>
                            <option value="plan">Plan / Membership</option>
                        </select>
                    </div>

                    {selectedType === 'plan' && (
                        <div className="grid grid-cols-2 gap-4 border-l-2 border-primary pl-4 py-2 bg-muted/20 rounded-r-md">
                            <div className="space-y-2">
                                <label htmlFor="duration_months" className="text-sm font-medium">
                                    Duration (Months)
                                </label>
                                <Input
                                    id="duration_months"
                                    name="duration_months"
                                    type="number"
                                    defaultValue={product?.duration_months || ''}
                                    placeholder="e.g. 1"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Blank for indefinite
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="credits_amount" className="text-sm font-medium">
                                    Credits / Entries
                                </label>
                                <Input
                                    id="credits_amount"
                                    name="credits_amount"
                                    type="number"
                                    defaultValue={product?.credits_amount || ''}
                                    placeholder="e.g. 11"
                                />
                                <p className="text-xs text-muted-foreground">
                                    For packs (e.g. 11er Karte)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="recurring_interval" className="text-sm font-medium">
                                    Recurring Interval
                                </label>
                                <select
                                    id="recurring_interval"
                                    name="recurring_interval"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    defaultValue={product?.recurring_interval || ''}
                                >
                                    <option value="">None (One-off)</option>
                                    <option value="month">Monthly</option>
                                    <option value="year">Yearly</option>
                                    <option value="week">Weekly</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {product && (
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="active"
                                name="active"
                                defaultChecked={product.active}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="active" className="text-sm font-medium">
                                Active
                            </label>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">Save</Button>
                </CardFooter>
            </form>
        </Card>
    )
}
