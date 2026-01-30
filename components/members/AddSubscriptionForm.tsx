'use client'

import { createSubscription } from '@/app/actions/subscriptions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AddSubscriptionForm({
    userId,
    plans,
}: {
    userId: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plans: any[]
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)

        try {
            await createSubscription(userId, formData)
            const form = event.target as HTMLFormElement
            form.reset()
            router.refresh()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            <div className="space-y-2">
                <label className="text-sm font-medium">Select Plan</label>
                <select
                    name="product_id"
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                    required
                >
                    <option value="">Choose a plan...</option>
                    {plans.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} - ${p.price}
                            {p.duration_months ? ` / ${p.duration_months} months` : ''}
                            {p.credits_amount ? ` / ${p.credits_amount} entries` : ''}
                        </option>
                    ))}
                </select>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus-visible:ring-zinc-300"
            >
                {loading ? 'Adding...' : 'Add Subscription'}
            </button>
        </form>
    )
}
