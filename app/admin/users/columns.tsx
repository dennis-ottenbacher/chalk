'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Pencil } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export type User = {
    id: string
    member_id: string | null
    first_name: string | null
    last_name: string | null
    role: string
    created_at: string
}

export const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'member_id',
        header: 'Member ID',
        cell: ({ row }) => {
            return row.getValue('member_id') || '-'
        },
    },
    {
        accessorKey: 'last_name', // Accessing last_name for sorting, but displaying full name
        id: 'name', // Custom ID for the column
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
        cell: ({ row }) => {
            const firstName = row.original.first_name || ''
            const lastName = row.original.last_name || ''
            return <div className="font-medium">{`${firstName} ${lastName}`}</div>
        },
        filterFn: (row, id, value) => {
            const firstName = row.original.first_name?.toLowerCase() || ''
            const lastName = row.original.last_name?.toLowerCase() || ''
            const fullName = `${firstName} ${lastName}`
            return fullName.includes(value.toLowerCase())
        },
    },
    {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
            return <div className="capitalize">{row.getValue('role')}</div>
        },
    },
    {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'))
            return <div>{date.toLocaleDateString()}</div>
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const user = row.original
            return (
                <div className="flex justify-end text-right gap-1">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/users/${user.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )
        },
        header: () => <div className="text-right">Actions</div>,
    },
]
