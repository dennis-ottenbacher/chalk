'use client'

import { toggleWaiver } from '@/app/actions/members'
import { useState } from 'react'

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
            <button
                onClick={handleToggle}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-300 dark:focus-visible:ring-offset-zinc-950 ${
                    status ? 'bg-green-600' : 'bg-zinc-200 dark:bg-zinc-700'
                }`}
            >
                <span className="sr-only">Toggle waiver</span>
                <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                        status ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
            <span className="text-sm font-medium">{status ? 'Signed' : 'Not Signed'}</span>
        </div>
    )
}
