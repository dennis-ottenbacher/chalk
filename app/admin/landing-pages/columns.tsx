import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LandingPage } from '@/app/actions/landing-pages'

import { StatusCell } from './StatusCell'
import { ActionsCell } from './ActionsCell'

export const columns: ColumnDef<LandingPage>[] = [
    {
        accessorKey: 'title',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Titel
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
    },
    {
        accessorKey: 'slug',
        header: 'Slug',
        cell: ({ row }) => (
            <Link
                href={`/landing-page/${row.getValue('slug')}`}
                target="_blank"
                className="font-mono text-sm text-blue-600 hover:underline"
            >
                /landing-page/{row.getValue('slug')}
            </Link>
        ),
    },
    {
        accessorKey: 'is_published',
        header: 'Status',
        cell: ({ row }) => <StatusCell page={row.original} />,
    },
    {
        accessorKey: 'created_at',
        header: 'Erstellt',
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'))
            return <div>{date.toLocaleDateString('de-DE')}</div>
        },
    },
    {
        accessorKey: 'updated_at',
        header: 'Aktualisiert',
        cell: ({ row }) => {
            const date = new Date(row.getValue('updated_at'))
            return <div>{date.toLocaleDateString('de-DE')}</div>
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => <ActionsCell page={row.original} />,
    },
]
