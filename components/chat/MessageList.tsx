'use client'

import { useRef, useEffect } from 'react'
import { MessageItem } from './MessageItem'
import type { ChatMessage } from '@/app/actions/chat'

interface MessageListProps {
    messages: ChatMessage[]
    currentUserId: string
    onReaction: (messageId: string, emoji: string) => void
    onRemoveReaction: (messageId: string, emoji: string) => void
    onThreadClick: (message: ChatMessage) => void
    onEditMessage?: (message: ChatMessage) => void
    onDeleteMessage?: (messageId: string) => void
    isLoading?: boolean
}

export function MessageList({
    messages,
    currentUserId,
    onReaction,
    onRemoveReaction,
    onThreadClick,
    onEditMessage,
    onDeleteMessage,
    isLoading = false,
}: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    // Group messages by date
    const groupedMessages = messages.reduce<Record<string, ChatMessage[]>>((groups, message) => {
        const date = new Date(message.created_at).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(message)
        return groups
    }, {})

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
                    <span className="text-sm">Lade Nachrichten...</span>
                </div>
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">Noch keine Nachrichten</p>
                    <p className="text-sm">Sei der Erste, der etwas schreibt!</p>
                </div>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                    {/* Date Separator */}
                    <div className="flex items-center gap-4 my-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-muted rounded-full">
                            {date}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Messages */}
                    <div className="space-y-2">
                        {dateMessages.map((message, index) => {
                            const prevMessage = dateMessages[index - 1]
                            const showAuthor =
                                !prevMessage ||
                                prevMessage.user_id !== message.user_id ||
                                new Date(message.created_at).getTime() -
                                    new Date(prevMessage.created_at).getTime() >
                                    5 * 60 * 1000

                            return (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    currentUserId={currentUserId}
                                    showAuthor={showAuthor}
                                    onReaction={onReaction}
                                    onRemoveReaction={onRemoveReaction}
                                    onThreadClick={onThreadClick}
                                    onEdit={onEditMessage}
                                    onDelete={onDeleteMessage}
                                />
                            )
                        })}
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    )
}
