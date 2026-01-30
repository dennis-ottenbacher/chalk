import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import Link from 'next/link'

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single()

    if (!profile) return notFound()

    // Fetch subscriptions
    const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*, products(name)')
        .eq('user_id', id)
        .order('start_date', { ascending: false })

    // Fetch checkins
    const { data: checkins } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', id)
        .order('timestamp', { ascending: false })
        .limit(10)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {profile.first_name} {profile.last_name}
                    </h1>
                    <p className="text-muted-foreground">
                        Member ID: {profile.member_id || 'N/A'} • Role:{' '}
                        <span className="capitalize">{profile.role}</span>
                    </p>
                </div>
                <Button asChild>
                    <Link href={`/admin/members/${id}/edit`}>Profil bearbeiten</Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Subscription Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {subscriptions && subscriptions.length > 0 ? (
                            <div className="space-y-4">
                                {subscriptions.map(sub => (
                                    <div
                                        key={sub.id}
                                        className="flex justify-between items-center border p-3 rounded-lg"
                                    >
                                        <div>
                                            <div className="font-semibold">
                                                {sub.products?.name || 'Unknown Plan'}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(sub.start_date).toLocaleDateString()} -{' '}
                                                {sub.end_date
                                                    ? new Date(sub.end_date).toLocaleDateString()
                                                    : 'Indefinite'}
                                            </div>
                                        </div>
                                        <Badge variant={sub.is_active ? 'default' : 'destructive'}>
                                            {sub.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No active subscriptions.</p>
                        )}
                        <div className="mt-4">
                            <Button variant="outline" size="sm">
                                Manage Subscriptions
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Check-ins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {checkins && checkins.length > 0 ? (
                                    checkins.map(checkin => (
                                        <TableRow key={checkin.id}>
                                            <TableCell>
                                                {new Date(checkin.timestamp).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(checkin.timestamp).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        checkin.status === 'valid'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {checkin.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">
                                            No recent check-ins.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
