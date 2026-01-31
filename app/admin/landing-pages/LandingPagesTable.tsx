'use client'

import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { LandingPage } from '@/app/actions/landing-pages'

interface LandingPagesTableProps {
    data: LandingPage[]
}

export function LandingPagesTable({ data }: LandingPagesTableProps) {
    return (
        <DataTable
            columns={columns}
            data={data}
            filterColumn="title"
            filterPlaceholder="Seiten durchsuchen..."
        />
    )
}
