'use client'

import { updateSettings } from '@/app/actions/settings'
import { Switch } from '@/components/ui/switch'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

interface SettingsFormProps {
    initialSettings: {
        pos_direct_checkout: boolean
    }
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [isPending, startTransition] = useTransition()
    const [posDirectCheckout, setPosDirectCheckout] = useState(initialSettings.pos_direct_checkout)

    const handleToggle = (checked: boolean) => {
        setPosDirectCheckout(checked) // Optimistic update
        startTransition(async () => {
            try {
                await updateSettings({ pos_direct_checkout: checked })
            } catch (error) {
                console.error(error)
                // Revert
                setPosDirectCheckout(!checked)
            }
        })
    }

    return (
        <div className="rounded-md border bg-white p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <div className="text-base font-medium">Direct Payout Options</div>
                    <div className="text-sm text-muted-foreground">
                        Show &quot;Cash&quot; and &quot;Card&quot; buttons directly in the cart
                        footer instead of a &quot;Checkout&quot; button step.
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isPending && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Switch
                        checked={posDirectCheckout}
                        onCheckedChange={handleToggle}
                        disabled={isPending}
                    />
                </div>
            </div>
        </div>
    )
}
