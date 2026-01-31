'use client'

import { toggleWaiver } from '@/app/actions/members'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function WaiverToggle({
    userId,
    initialStatus,
}: {
    userId: string
    initialStatus: boolean
}) {
    const [status, setStatus] = useState(initialStatus)
    const [loading, setLoading] = useState(false)

    async function handleToggle() {
        setLoading(true)
        try {
            const newStatus = !status
            await toggleWaiver(userId, newStatus)
            setStatus(newStatus)
        } catch (error) {
            console.error('Failed to toggle waiver', error)
            alert('Failed to update waiver status')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center space-x-2">
            <Switch
                id="waiver-toggle"
                checked={status}
                onCheckedChange={handleToggle}
                disabled={loading}
            />
            <Label htmlFor="waiver-toggle" className="text-sm font-medium">
                {status ? 'Signed' : 'Not Signed'}
            </Label>
        </div>
    )
}
