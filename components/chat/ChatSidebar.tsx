'use client'

import { useState } from 'react'
import { Hash, Lock, Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ChatChannel } from '@/app/actions/chat'

interface ChatSidebarProps {
    channels: ChatChannel[]
    activeChannelId: string | null
    unreadCounts: Record<string, number>
    onChannelSelect: (channel: ChatChannel) => void
    onCreateChannel: () => void
    onChannelSettings?: (channel: ChatChannel) => void
}

export function ChatSidebar({
    channels,
    activeChannelId,
    unreadCounts,
    onChannelSelect,
    onCreateChannel,
    onChannelSettings,
}: ChatSidebarProps) {
    const [hoveredChannel, setHoveredChannel] = useState<string | null>(null)

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground text-lg">Channels</h2>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                    {channels.map(channel => {
                        const isActive = channel.id === activeChannelId
                        const unreadCount = unreadCounts[channel.id] || 0
                        const isHovered = hoveredChannel === channel.id

                        return (
                            <div
                                key={channel.id}
                                className={cn(
                                    'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-150',
                                    isActive
                                        ? 'bg-primary/15 text-primary'
                                        : 'hover:bg-muted text-foreground/80'
                                )}
                                onClick={() => onChannelSelect(channel)}
                                onMouseEnter={() => setHoveredChannel(channel.id)}
                                onMouseLeave={() => setHoveredChannel(null)}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    {channel.is_private ? (
                                        <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    ) : (
                                        <Hash className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    )}
                                    <span
                                        className={cn(
                                            'truncate text-sm',
                                            unreadCount > 0 && 'font-semibold'
                                        )}
                                    >
                                        {channel.name}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && !isActive && (
                                        <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                    {isHovered && onChannelSettings && (
                                        <button
                                            className="p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={e => {
                                                e.stopPropagation()
                                                onChannelSettings(channel)
                                            }}
                                        >
                                            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Create Channel Button */}
            <div className="p-3 border-t border-border">
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={onCreateChannel}
                >
                    <Plus className="h-4 w-4" />
                    Neuer Channel
                </Button>
            </div>
        </div>
    )
}
