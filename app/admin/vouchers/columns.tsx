'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type Voucher = {
    id: string
    code: string
    initial_amount: number
    remaining_amount: number
    status: 'active' | 'used' | 'expired'
    created_at: string
    expires_at: string | null
    transaction_id?: string
}

export const columns: ColumnDef<Voucher>[] = [
    {
        accessorKey: 'code',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Code
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('code')}</div>,
    },
    {
        accessorKey: 'initial_amount',
        header: 'Initial Amount',
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('initial_amount'))
            return <div>{amount.toFixed(2)}€</div>
        },
    },
    {
        accessorKey: 'remaining_amount',
        header: 'Remaining Amount',
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('remaining_amount'))
            return <div>{amount.toFixed(2)}€</div>
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string
            return <div className="capitalize">{status}</div>
        },
    },
    {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'))
            return <div>{date.toLocaleDateString('de-DE')}</div>
        },
    },
    {
        accessorKey: 'expires_at',
        header: 'Expires At',
        cell: ({ row }) => {
            const dateStr = row.getValue('expires_at') as string | null
            if (!dateStr) return <div className="text-gray-400">-</div>
            const date = new Date(dateStr)
            return <div>{date.toLocaleDateString('de-DE')}</div>
        },
    },
]
