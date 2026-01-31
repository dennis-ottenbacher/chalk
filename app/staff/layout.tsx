import type { Metadata } from 'next'
import { StaffSidebar } from '@/components/staff/sidebar'

export const metadata: Metadata = {
    title: 'Chalk Staff',
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-background">
            <StaffSidebar />
            <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
        </div>
    )
}
