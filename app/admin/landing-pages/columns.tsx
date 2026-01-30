'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ExternalLink, MoreHorizontal, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    publishLandingPage,
    unpublishLandingPage,
    deleteLandingPage,
} from '@/app/actions/landing-pages'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export type LandingPage = {
    id: string
    slug: string
    title: string
    is_published: boolean
    created_at: string
    updated_at: string
}

function StatusCell({ page }: { page: LandingPage }) {
    const router = useRouter()
    const isPublished = page.is_published

    const handleStatusChange = async (published: boolean) => {
        if (published) {
            await publishLandingPage(page.id)
        } else {
            await unpublishLandingPage(page.id)
        }
        router.refresh()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                    {isPublished ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            Veröffentlicht
                        </Badge>
                    ) : (
                        <Badge variant="secondary">Entwurf</Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuCheckboxItem
                    checked={isPublished}
                    onCheckedChange={checked => handleStatusChange(checked)}
                >
                    Veröffentlicht
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function ActionsCell({ page }: { page: LandingPage }) {
    const router = useRouter()

    const handlePublish = async () => {
        await publishLandingPage(page.id)
        router.refresh()
    }

    const handleUnpublish = async () => {
        await unpublishLandingPage(page.id)
        router.refresh()
    }

    const handleDelete = async () => {
        if (!confirm(`Möchtest du die Seite "${page.title}" wirklich löschen?`)) return
        await deleteLandingPage(page.id)
        router.refresh()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Menü öffnen</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <a
                        href={`/landing-page/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Vorschau
                    </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {page.is_published ? (
                    <DropdownMenuItem onClick={handleUnpublish}>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Veröffentlichung aufheben
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={handlePublish}>
                        <Eye className="mr-2 h-4 w-4" />
                        Veröffentlichen
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

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
