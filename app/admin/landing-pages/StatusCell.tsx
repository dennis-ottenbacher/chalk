'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LandingPage, publishLandingPage, unpublishLandingPage } from '@/app/actions/landing-pages'
import { useRouter } from 'next/navigation'

interface StatusCellProps {
    page: LandingPage
}

export function StatusCell({ page }: StatusCellProps) {
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
