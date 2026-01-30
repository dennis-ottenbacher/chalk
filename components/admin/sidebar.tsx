'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Calendar,
    Settings,
    Shield,
    Book,
    Bot,
    Ticket,
    ClipboardList,
    MessageSquare,
    FileText,
} from 'lucide-react'

const navigation = [
    { name: 'Chalk Bot', href: '/admin/agent', icon: Bot },
    { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: ShoppingBag },
    { name: 'Vouchers', href: '/admin/vouchers', icon: Ticket },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Shifts', href: '/admin/shifts', icon: Calendar },
    { name: 'Checklists', href: '/admin/checklists', icon: ClipboardList },
    { name: 'Landing Pages', href: '/admin/landing-pages', icon: FileText },
    { name: 'Permissions', href: '/admin/permissions', icon: Shield },
    { name: 'Knowledge Base', href: '/admin/knowledge', icon: Book },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
            <div className="flex h-16 items-center justify-center border-b border-gray-800">
                <h1 className="text-xl font-bold">Chalk Admin</h1>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {navigation.map(item => {
                    const isActive = pathname === item.href
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
