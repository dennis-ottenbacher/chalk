import type { Metadata } from 'next'
import { StaffSidebar } from '@/components/staff/sidebar'

export const metadata: Metadata = {
    title: 'Chalk Staff',
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-100">
            <StaffSidebar />
            <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
    )
}
