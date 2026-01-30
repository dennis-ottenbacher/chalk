import { createClient } from '@/utils/supabase/server'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { getOrganizationId } from '@/lib/get-organization'

export default async function VouchersPage() {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { data: vouchers, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    if (error) {
        return <div>Error loading vouchers: {error.message}</div>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Vouchers</h1>

            <div className="rounded-md border bg-white">
                <DataTable
                    columns={columns}
                    data={vouchers || []}
                    filterColumn="code"
                    filterPlaceholder="Search voucher codes..."
                />
            </div>
        </div>
    )
}
