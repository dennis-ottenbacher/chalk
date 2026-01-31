'use client'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react'
import {
    LandingPage,
    publishLandingPage,
    unpublishLandingPage,
    deleteLandingPage,
} from '@/app/actions/landing-pages'
import { useRouter } from 'next/navigation'

interface ActionsCellProps {
    page: LandingPage
}

export function ActionsCell({ page }: ActionsCellProps) {
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
                        href={`/landing-page/preview/${page.slug}`}
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
