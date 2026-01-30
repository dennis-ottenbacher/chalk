'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Eye, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export type Member = {
    id: string
    member_id: string | null
    first_name: string | null
    last_name: string | null
    role: string
}

export const columns: ColumnDef<Member>[] = [
    {
        accessorKey: 'member_id',
        header: 'Member ID',
        cell: ({ row }) => <div>{row.getValue('member_id') || '-'}</div>,
    },
    {
        accessorKey: 'last_name', // sort by last name, similar to Users
        id: 'name',
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
        cell: ({ row }) => <div className="capitalize">{row.getValue('role')}</div>,
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const member = row.original
            return (
                <div className="flex justify-end text-right gap-1">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/members/${member.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/members/${member.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )
        },
        header: () => <div className="text-right">Actions</div>,
    },
]
