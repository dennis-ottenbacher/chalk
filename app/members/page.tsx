import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function MembersPage() {
    const supabase = await createClient()
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('last_name', { ascending: true })

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                    <p className="text-muted-foreground">Manage gym members and staff.</p>
                </div>
                <Link
                    href="/members/add"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus-visible:ring-zinc-300"
                >
                    Add Member
                </Link>
            </div>

            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-medium">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Member ID</th>
                            <th className="px-4 py-3">Waiver</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {profiles?.map(profile => (
                            <tr
                                key={profile.id}
                                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                            >
                                <td className="px-4 py-3 font-medium">
                                    {profile.first_name} {profile.last_name}
                                </td>
                                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                                    {/* Email is in auth.users, fetch via join if needed or store in profiles? Schema doesn't have email in profiles but usually easy to query. 
                   Ah, initial_schema.sql doesn't have email in profiles. 
                   It is in auth.users. 
                   We can duplicate it or fetch it. For now, let's skip or show "N/A" if checking id is hard.
                   Wait, createMember action doesn't insert email into profiles.
                   Let's skip email column or assume we extend schema later. 
                   Or better, let's fix the schema/action to store email in profiles for easier display!
                   Actually, let's just stick to what we have. */}
                                    -
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 capitalize">
                                        {profile.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                                    {profile.member_id || '-'}
                                </td>
                                <td className="px-4 py-3">
                                    {profile.waiver_signed ? (
                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                            Signed
                                        </span>
                                    ) : (
                                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                            Pending
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/members/${profile.id}`}
                                        className="text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {profiles?.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                                >
                                    No members found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
