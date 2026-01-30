import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'

export default async function UsersPage() {
    const supabase = await createClient()
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'manager', 'staff'])
        .order('last_name')

    if (error) {
        return <div>Error loading users</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                <Link href="/admin/users/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add User
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border bg-white">
                <DataTable
                    columns={columns}
                    data={users}
                    filterColumn="name"
                    filterPlaceholder="Search users..."
                />
            </div>
        </div>
    )
}
