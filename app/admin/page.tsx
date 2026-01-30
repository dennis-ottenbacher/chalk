import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CheckCircle, DollarSign, Calendar } from 'lucide-react'
import { getDashboardStats } from '@/app/actions/dashboard'
import Link from 'next/link'

export default async function AdminDashboardPage() {
    const stats = await getDashboardStats()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeMembers}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered members & athletes
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Today&apos;s Check-ins
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.todaysCheckins}</div>
                        <p className="text-xs text-muted-foreground">Valid check-ins today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue (Today)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('de-DE', {
                                style: 'currency',
                                currency: 'EUR',
                            }).format(stats.todaysRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Completed transactions today
                        </p>
                    </CardContent>
                </Card>

                <Link href="/admin/shifts" className="block">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Open Shifts</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.openShifts}</div>
                            <p className="text-xs text-muted-foreground">
                                Unassigned future shifts
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
