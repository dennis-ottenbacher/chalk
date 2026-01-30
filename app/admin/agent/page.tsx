'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    getEvents,
    deleteEvent,
    getChalkMessages,
    sendChalkMessage,
} from '@/app/actions/chalk-agent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, Trash2 } from 'lucide-react'
import { AgentChat } from '@/components/staff/agent-chat'
import { format } from 'date-fns'

type StaffEvent = {
    id: string
    event_description: string
    start_time: string
    end_time: string
    created_at: string
}

export default function AdminAgentPage() {
    const [events, setEvents] = useState<StaffEvent[]>([])
    const searchParams = useSearchParams()
    const initialPrompt = searchParams.get('prompt') || undefined

    const loadEvents = async () => {
        const evts = await getEvents()
        setEvents(evts || [])
    }

    useEffect(() => {
        const fetchEvents = async () => {
            const evts = await getEvents()
            setEvents(evts || [])
        }
        fetchEvents()
    }, [])

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return
        await deleteEvent(id)
        loadEvents()
    }

    return (
        <div className="flex h-full gap-6 relative">
            <AgentChat
                className="flex-1 h-[calc(100vh-8rem)]"
                onMessageSent={loadEvents}
                getMessagesFn={getChalkMessages}
                sendMessageFn={sendChalkMessage}
                initialPrompt={initialPrompt}
            />

            {/* Events Sidebar */}
            <Card className="w-80 h-[calc(100vh-8rem)]">
                <CardHeader>
                    <CardTitle>My Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[calc(100vh-14rem)] overflow-y-auto">
                        {events.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                                No events recorded.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {events.map(event => (
                                    <div
                                        key={event.id}
                                        className="border rounded-md p-3 relative group"
                                    >
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive"
                                                onClick={() => handleDeleteEvent(event.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <h4 className="font-medium text-sm">
                                            {event.event_description}
                                        </h4>
                                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                            <div className="flex items-center gap-1">
                                                <CalendarIcon className="h-3 w-3" />
                                                {format(new Date(event.start_time), 'MMM d, HH:mm')}
                                            </div>
                                            <div className="flex items-center gap-1 pl-4">
                                                to{' '}
                                                {format(new Date(event.end_time), 'MMM d, HH:mm')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
