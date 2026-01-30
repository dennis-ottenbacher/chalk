import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { getLandingPages } from '@/app/actions/landing-pages'
import { CreateLandingPageDialog } from './CreateLandingPageDialog'

export default async function LandingPagesPage() {
    const landingPages = await getLandingPages()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Landing Pages</h1>
                <CreateLandingPageDialog />
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
