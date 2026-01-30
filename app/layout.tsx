import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { getOrganizationOptional, isMarketingSite } from '@/lib/get-organization'
import { TenantProvider } from '@/lib/tenant-context'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'Chalk POS',
    description: 'Boulder Gym Point of Sale System',
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    // Check if this is a marketing site (www subdomain)
    const isMarketing = await isMarketingSite()

    // Only fetch organization for non-marketing pages
    const organization = isMarketing ? null : await getOrganizationOptional()

    return (
        <html lang={isMarketing ? 'de' : 'en'}>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {isMarketing || !organization ? (
                    children
                ) : (
                    <TenantProvider organization={organization}>{children}</TenantProvider>
                )}
                <Toaster />
            </body>
        </html>
    )
}
