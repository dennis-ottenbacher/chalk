'use client'

import { Hash, Lock, Users, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ChatChannel } from '@/app/actions/chat'

interface ChannelHeaderProps {
    channel: ChatChannel | null
    memberCount?: number
    onShowMembers?: () => void
    onShowSettings?: () => void
}

export function ChannelHeader({
    channel,
    memberCount = 0,
    onShowMembers,
    onShowSettings,
}: ChannelHeaderProps) {
    if (!channel) {
        return (
            <div className="h-16 border-b border-gray-200 bg-white flex items-center px-4">
                <span className="text-gray-500">Wähle einen Channel aus</span>
            </div>
        )
    }

    return (
        <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    {channel.is_private ? (
                        <Lock className="h-5 w-5 text-gray-500" />
                    ) : (
                        <Hash className="h-5 w-5 text-gray-500" />
                    )}
                    <h1 className="font-semibold text-lg text-gray-900">{channel.name}</h1>
                </div>
                {channel.description && (
                    <>
                        <div className="h-4 w-px bg-gray-300" />
                        <span className="text-sm text-gray-500 truncate max-w-md">
                            {channel.description}
                        </span>
                    </>
                )}
            </div>

            <div className="flex items-center gap-2">
                {onShowMembers && (
                    <Button variant="ghost" size="sm" className="gap-2" onClick={onShowMembers}>
                        <Users className="h-4 w-4" />
                        <span>{memberCount}</span>
                    </Button>
                )}
                {onShowSettings && (
                    <Button variant="ghost" size="sm" onClick={onShowSettings}>
                        <Settings className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
