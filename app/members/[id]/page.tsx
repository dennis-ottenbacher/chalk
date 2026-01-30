import { createClient } from '@/utils/supabase/server'
import { WaiverToggle } from '@/components/members/WaiverToggle'
import { AddSubscriptionForm } from '@/components/members/AddSubscriptionForm'
import { cancelSubscription } from '@/app/actions/subscriptions'

export default async function MemberDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!profile) {
        return <div className="p-10">Member not found</div>
    }

    // Fetch Subscriptions
    const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*, products(name, price)')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false })

    // Fetch Plans for adding new
    const { data: plans } = await supabase
        .from('products')
        .select('*')
        .eq('type', 'plan')
        .eq('active', true)

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {profile.first_name} {profile.last_name}
                </h1>
                <p className="text-muted-foreground">
                    {profile.role} • {profile.email || 'No Email'} • ID:{' '}
                    {profile.member_id || 'N/A'}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Info / Settings */}
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">
                            Status & Settings
                        </h3>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                        <div className="flex justify-between items-center border-b pb-4">
                            <span className="font-medium">Waiver Signed</span>
                            <WaiverToggle
                                userId={profile.id}
                                initialStatus={profile.waiver_signed || false}
                            />
                        </div>
                    </div>
                </div>

                {/* Subscriptions */}
                <div className="rounded-xl border bg-card text-card-foreground shadow col-span-1 md:col-span-2 lg:col-span-1">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">
                            Active Subscriptions
                        </h3>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                        {subscriptions?.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No active subscriptions.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {subscriptions?.map(sub => (
                                    <div
                                        key={sub.id}
                                        className="flex justify-between items-center rounded-lg border p-3"
                                    >
                                        <div>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            <p className="font-medium">
                                                {(sub.products as any)?.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(sub.start_date).toLocaleDateString()} -
                                                {sub.end_date
                                                    ? new Date(sub.end_date).toLocaleDateString()
                                                    : ' Indefinite'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${sub.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                            >
                                                {sub.is_active ? 'Active' : 'Cancelled'}
                                            </span>
                                            {sub.is_active && (
                                                <form
                                                    action={async () => {
                                                        'use server'
                                                        await cancelSubscription(sub.id, params.id)
                                                    }}
                                                >
                                                    <button className="text-xs text-red-600 hover:text-red-800">
                                                        Cancel
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-4 border-t mt-4">
                            <h4 className="text-sm font-medium mb-3">Add Subscription</h4>
                            <AddSubscriptionForm userId={profile.id} plans={plans || []} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
