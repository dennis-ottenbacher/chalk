'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export type StaffMember = {
    id: string
    member_id: string | null
    first_name: string | null
    last_name: string | null
    role: string
    avatar_url: string | null
}

export const columns: ColumnDef<StaffMember>[] = [
    {
        accessorKey: 'avatar',
        header: 'Avatar',
        cell: ({ row }) => {
            const member = row.original
            return (
                <Avatar>
                    <AvatarImage src={member.avatar_url || ''} />
                    <AvatarFallback>
                        {(member.first_name?.[0] || '').toUpperCase()}
                        {(member.last_name?.[0] || '').toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            )
        },
    },
    {
        accessorKey: 'last_name', // Sort by last name
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
        cell: ({ row }) => {
            const role = row.getValue('role') as string
            return <Badge variant={role === 'admin' ? 'default' : 'secondary'}>{role}</Badge>
        },
    },
    {
        accessorKey: 'member_id',
        header: 'Member ID',
        cell: ({ row }) => <div>{row.getValue('member_id') || '-'}</div>,
    },
]
