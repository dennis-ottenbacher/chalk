'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductActions } from './product-actions'

export type Product = {
    id: string
    name: string
    type: string
    price: number
    tax_rate: number
    active: boolean
    duration_months: number | null
    credits_amount: number | null
    recurring_interval: string | null
}

export const columns: ColumnDef<Product>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <div className="capitalize">{row.getValue('type')}</div>,
    },
    {
        accessorKey: 'price',
        header: 'Price (Brutto)',
        cell: ({ row }) => {
            const price = parseFloat(row.getValue('price'))
            return <div>${price.toFixed(2)}</div>
        },
    },
    {
        accessorKey: 'tax_rate',
        header: 'Tax Rate',
        cell: ({ row }) => <div>{row.getValue('tax_rate')}%</div>,
    },
    {
        accessorKey: 'duration_months',
        header: 'Duration',
        cell: ({ row }) => {
            const duration = row.getValue('duration_months') as number
            if (!duration) return <div className="text-gray-400">-</div>
            return <div>{duration} Months</div>
        },
    },
    {
        accessorKey: 'credits_amount',
        header: 'Credits',
        cell: ({ row }) => {
            const credits = row.getValue('credits_amount') as number
            if (!credits) return <div className="text-gray-400">-</div>
            return <div>{credits} Entries</div>
        },
    },
    {
        accessorKey: 'recurring_interval',
        header: 'Recurring',
        cell: ({ row }) => {
            const interval = row.getValue('recurring_interval') as string
            if (!interval) return <div className="text-gray-400">-</div>
            return <div className="capitalize">{interval}</div>
        },
    },
    {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ row }) => {
            const isActive = row.getValue('active')
            return (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                >
                    {isActive ? 'Active' : 'Inactive'}
                </span>
            )
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const product = row.original
            return <ProductActions productId={product.id} />
        },
        header: () => <div className="text-right">Actions</div>,
    },
]
