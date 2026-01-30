import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { getLandingPages } from '@/app/actions/landing-pages'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function LandingPagesPage() {
    const landingPages = await getLandingPages()

    const addLandingPagePrompt = encodeURIComponent(
        'Erstelle mir eine Landingpage. Auf der Seite soll folgendes zu sehen sein: '
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Landing Pages</h1>
                <Link href={`/admin/agent?prompt=${addLandingPagePrompt}`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Landing Page
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border bg-white">
                <DataTable
                    columns={columns}
                    data={landingPages}
                    filterColumn="title"
                    filterPlaceholder="Seiten durchsuchen..."
                />
            </div>
        </div>
    )
}
