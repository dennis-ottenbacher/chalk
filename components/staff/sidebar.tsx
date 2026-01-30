'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Bot, Calendar, Settings, ClipboardCheck, MessageSquare } from 'lucide-react'

const navigation = [
    { name: 'Talk to Chalk', href: '/staff/agent', icon: Bot },
    { name: 'Chat', href: '/staff/chat', icon: MessageSquare },
    { name: 'Shifts', href: '/staff/shifts', icon: Calendar },
    { name: 'Checklists', href: '/staff/checklists', icon: ClipboardCheck },
    { name: 'Settings', href: '/staff/settings', icon: Settings },
]

export function StaffSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
            <div className="flex h-16 items-center justify-center border-b border-gray-800">
                <h1 className="text-xl font-bold">Chalk Staff</h1>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {navigation.map(item => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
