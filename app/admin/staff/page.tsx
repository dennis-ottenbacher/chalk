import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'

export default async function StaffPage() {
    const supabase = await createClient()

    const { data: staffMembers } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'staff'])
        .order('role', { ascending: true }) // admin comes before staff
        .order('last_name', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Staff Overview</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your administrators and staff members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={staffMembers || []}
                        filterColumn="name"
                        filterPlaceholder="Search staff..."
                    />
                </CardContent>
            </Card>
        </div>
    )
}
