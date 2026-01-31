'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
    MessageSquare,
    Smile,
    Edit2,
    Trash2,
    MoreHorizontal,
    Image as ImageIcon,
} from 'lucide-react'
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
                'group relative flex w-full mb-2',
                isOwnMessage ? 'justify-end' : 'justify-start'
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
                setShowActions(false)
                setShowReactionPicker(false)
                setShowMoreMenu(false)
            }}
        >
            {/* Avatar (only for others) */}
            {!isOwnMessage && (
                <div className={cn('flex flex-col justify-end mr-2', !showAuthor && 'invisible')}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={message.user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </div>
            )}

            <div
                className={cn(
                    'flex flex-col max-w-[70%]',
                    isOwnMessage ? 'items-end' : 'items-start'
                )}
            >
                {/* Author Name (only for others and if showAuthor is true) */}
                {!isOwnMessage && showAuthor && (
                    <span className="text-xs text-muted-foreground ml-1 mb-1">{userName}</span>
                )}

                {/* Bubble */}
                <div
                    className={cn(
                        'relative px-3 py-2 text-sm shadow-sm',
                        isOwnMessage
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-none'
                            : 'bg-muted text-foreground rounded-2xl rounded-bl-none'
                    )}
                >
                    {/* Message Content */}
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>

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
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={attachment.file_url}
                                                alt={attachment.file_name}
                                                className="max-w-full max-h-60 rounded-lg"
                                            />
                                        </a>
                                    ) : (
                                        <a
                                            href={attachment.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                                                isOwnMessage
                                                    ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
                                                    : 'bg-background hover:bg-background/80'
                                            )}
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                            <span className="truncate max-w-[150px]">
                                                {attachment.file_name}
                                            </span>
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Metadata (Time & Edited) */}
                    <div
                        className={cn(
                            'flex items-center gap-1 mt-1 text-[10px]',
                            isOwnMessage
                                ? 'text-primary-foreground/70 justify-end'
                                : 'text-muted-foreground/70 justify-end'
                        )}
                    >
                        {message.is_edited && <span>(bearbeitet)</span>}
                        <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                    </div>
                </div>

                {/* Reactions */}
                {Object.keys(reactionGroups).length > 0 && (
                    <div
                        className={cn(
                            'flex flex-wrap gap-1 mt-1',
                            isOwnMessage ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {Object.entries(reactionGroups).map(([emoji, reactions]) => {
                            const hasUserReacted = reactions.some(r => r.user_id === currentUserId)
                            return (
                                <button
                                    key={emoji}
                                    className={cn(
                                        'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors border shadow-sm',
                                        hasUserReacted
                                            ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                                            : 'bg-background border-border text-foreground hover:bg-muted'
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
                                    <span className="font-medium">{reactions.length}</span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Thread Link */}
                {message.reply_count > 0 && (
                    <button
                        className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => onThreadClick(message)}
                    >
                        <MessageSquare className="h-3 w-3" />
                        <span>
                            {message.reply_count}{' '}
                            {message.reply_count === 1 ? 'Antwort' : 'Antworten'}
                        </span>
                    </button>
                )}
            </div>

            {/* Action Buttons (Hover) */}
            {showActions && (
                <div
                    className={cn(
                        'absolute top-0 flex items-center gap-0.5 bg-background border border-border rounded-lg shadow-sm p-0.5 z-10',
                        isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
                    )}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-muted"
                        onClick={() => setShowReactionPicker(!showReactionPicker)}
                    >
                        <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-muted"
                        onClick={() => onThreadClick(message)}
                    >
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>

                    {isOwnMessage && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-muted"
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                            >
                                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            {showMoreMenu && (
                                <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-md py-1 z-50 min-w-32">
                                    {onEdit && (
                                        <button
                                            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-muted"
                                            onClick={() => {
                                                onEdit(message)
                                                setShowMoreMenu(false)
                                            }}
                                        >
                                            <Edit2 className="h-3 w-3" />
                                            Bearbeiten
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                onDelete(message.id)
                                                setShowMoreMenu(false)
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Löschen
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {showReactionPicker && (
                        <div className="absolute top-full left-0 pt-2 z-50">
                            <ReactionPicker
                                onSelect={emoji => {
                                    onReaction(message.id, emoji)
                                    setShowReactionPicker(false)
                                }}
                                onClose={() => setShowReactionPicker(false)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
