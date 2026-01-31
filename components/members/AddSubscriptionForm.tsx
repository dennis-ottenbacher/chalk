'use client'

import { createSubscription } from '@/app/actions/subscriptions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

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
    const [selectedPlan, setSelectedPlan] = useState<string>('')
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
            setSelectedPlan('')
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
            {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
                    {error}
                </div>
            )}
            <div className="space-y-2">
                <label className="text-sm font-medium">Select Plan</label>
                <Select
                    value={selectedPlan}
                    onValueChange={setSelectedPlan}
                    name="product_id"
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a plan..." />
                    </SelectTrigger>
                    <SelectContent>
                        {plans.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name} - ${p.price}
                                {p.duration_months ? ` / ${p.duration_months} months` : ''}
                                {p.credits_amount ? ` / ${p.credits_amount} entries` : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <input type="hidden" name="product_id" value={selectedPlan} />
            </div>
            <Button type="submit" disabled={loading || !selectedPlan}>
                {loading ? 'Adding...' : 'Add Subscription'}
            </Button>
        </form>
    )
}
