'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { MessageSquare, Smile, Edit2, Trash2, MoreHorizontal, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ReactionPicker } from './ReactionPicker'
import type { ChatMessage, ChatMessageReaction } from '@/app/actions/chat'

interface MessageItemProps {
    message: ChatMessage
    currentUserId: string
    showAuthor: boolean
    onReaction: (messageId: string, emoji: string) => void
    onRemoveReaction: (messageId: string, emoji: string) => void
    onThreadClick: (message: ChatMessage) => void
    onEdit?: (message: ChatMessage) => void
    onDelete?: (messageId: string) => void
}

export function MessageItem({
    message,
    currentUserId,
    showAuthor,
    onReaction,
    onRemoveReaction,
    onThreadClick,
    onEdit,
    onDelete,
}: MessageItemProps) {
    const [showActions, setShowActions] = useState(false)
    const [showReactionPicker, setShowReactionPicker] = useState(false)
    const [showMoreMenu, setShowMoreMenu] = useState(false)

    const isOwnMessage = message.user_id === currentUserId
    const userName = message.user
        ? `${message.user.first_name || ''} ${message.user.last_name || ''}`.trim() || 'Unbekannt'
        : 'Unbekannt'
    const initials = userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    // Group reactions by emoji
    const reactionGroups = (message.reactions || []).reduce<Record<string, ChatMessageReaction[]>>(
        (groups, reaction) => {
            if (!groups[reaction.emoji]) {
                groups[reaction.emoji] = []
            }
            groups[reaction.emoji].push(reaction)
            return groups
        },
        {}
    )

    return (
        <div
            className={cn(
                'group relative flex gap-3 px-2 py-1 rounded-lg transition-colors',
                'hover:bg-gray-50',
                !showAuthor && 'pl-12'
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
                setShowActions(false)
                setShowReactionPicker(false)
                setShowMoreMenu(false)
            }}
        >
            {/* Avatar */}
            {showAuthor && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Author & Time */}
                {showAuthor && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-gray-900">{userName}</span>
                        <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                                locale: de,
                            })}
                        </span>
                        {message.is_edited && (
                            <span className="text-xs text-gray-400">(bearbeitet)</span>
                        )}
                    </div>
                )}

                {/* Message Content */}
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {message.content}
                </p>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {message.attachments.map(attachment => (
                            <div key={attachment.id} className="relative group/attachment">
                                {attachment.file_type.startsWith('image/') ? (
                                    <a
                                        href={attachment.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <img
                                            src={attachment.file_url}
                                            alt={attachment.file_name}
                                            className="max-w-sm max-h-64 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                        />
                                    </a>
                                ) : (
                                    <a
                                        href={attachment.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        <Image className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-700 truncate max-w-xs">
                                            {attachment.file_name}
                                        </span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Reactions */}
                {Object.keys(reactionGroups).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(reactionGroups).map(([emoji, reactions]) => {
                            const hasUserReacted = reactions.some(r => r.user_id === currentUserId)
                            return (
                                <button
                                    key={emoji}
                                    className={cn(
                                        'flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-colors',
                                        hasUserReacted
                                            ? 'bg-blue-100 border border-blue-300 text-blue-700'
                                            : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                                    )}
                                    onClick={() => {
                                        if (hasUserReacted) {
                                            onRemoveReaction(message.id, emoji)
                                        } else {
                                            onReaction(message.id, emoji)
                                        }
                                    }}
                                >
                                    <span>{emoji}</span>
                                    <span className="text-xs font-medium">{reactions.length}</span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Thread indicator */}
                {message.reply_count > 0 && (
                    <button
                        className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                        onClick={() => onThreadClick(message)}
                    >
                        <MessageSquare className="h-4 w-4" />
                        <span>
                            {message.reply_count}{' '}
                            {message.reply_count === 1 ? 'Antwort' : 'Antworten'}
                        </span>
                    </button>
                )}
            </div>

            {/* Action buttons (show on hover) */}
            {showActions && (
                <div className="absolute -top-3 right-2 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm p-0.5">
                    {/* Reaction picker */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setShowReactionPicker(!showReactionPicker)}
                        >
                            <Smile className="h-4 w-4" />
                        </Button>
                        {showReactionPicker && (
                            <ReactionPicker
                                onSelect={emoji => {
                                    onReaction(message.id, emoji)
                                    setShowReactionPicker(false)
                                }}
                                onClose={() => setShowReactionPicker(false)}
                            />
                        )}
                    </div>

                    {/* Thread reply */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onThreadClick(message)}
                    >
                        <MessageSquare className="h-4 w-4" />
                    </Button>

                    {/* More actions for own messages */}
                    {isOwnMessage && (
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {showMoreMenu && (
                                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-32">
                                    {onEdit && (
                                        <button
                                            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => {
                                                onEdit(message)
                                                setShowMoreMenu(false)
                                            }}
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                            Bearbeiten
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                                onDelete(message.id)
                                                setShowMoreMenu(false)
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Löschen
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
