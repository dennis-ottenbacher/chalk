'use client'

import { X } from 'lucide-react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import type { ChatMessage } from '@/app/actions/chat'

interface ThreadPanelProps {
    parentMessage: ChatMessage
    replies: ChatMessage[]
    currentUserId: string
    isLoading: boolean
    onClose: () => void
    onSendReply: (content: string, attachments?: File[]) => Promise<void>
    onReaction: (messageId: string, emoji: string) => void
    onRemoveReaction: (messageId: string, emoji: string) => void
}

export function ThreadPanel({
    parentMessage,
    replies,
    currentUserId,
    isLoading,
    onClose,
    onSendReply,
    onReaction,
    onRemoveReaction,
}: ThreadPanelProps) {
    const userName = parentMessage.user
        ? `${parentMessage.user.first_name || ''} ${parentMessage.user.last_name || ''}`.trim() ||
          'Unbekannt'
        : 'Unbekannt'
    const initials = userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full">
            {/* Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
                <div>
                    <h2 className="font-semibold text-gray-900">Thread</h2>
                    <p className="text-xs text-gray-500">
                        {replies.length} {replies.length === 1 ? 'Antwort' : 'Antworten'}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Parent Message */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={parentMessage.user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="font-semibold text-sm text-gray-900">{userName}</span>
                            <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(parentMessage.created_at), {
                                    addSuffix: true,
                                    locale: de,
                                })}
                            </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {parentMessage.content}
                        </p>
                    </div>
                </div>
            </div>

            {/* Replies */}
            <MessageList
                messages={replies}
                currentUserId={currentUserId}
                onReaction={onReaction}
                onRemoveReaction={onRemoveReaction}
                onThreadClick={() => {}} // No nested threads
                isLoading={isLoading}
            />

            {/* Reply Input */}
            <MessageInput onSend={onSendReply} placeholder="Antworten..." isThreadReply />
        </div>
    )
}
