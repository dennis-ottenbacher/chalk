import { createClient } from '@/utils/supabase/server'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'

export default async function MembersPage() {
    const supabase = await createClient()
    const { data: members, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin') // Assuming we want to manage clear members/staff
        .order('last_name')

    if (error) {
        return <div>Error loading members</div>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Members</h1>

            <div className="rounded-md border bg-white">
                <DataTable
                    columns={columns}
                    data={members}
                    filterColumn="name"
                    filterPlaceholder="Search members..."
                />
            </div>
        </div>
    )
}
