'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { Database } from '@/types/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']

interface TenantContextValue {
    organization: Organization | null
    isLoading: boolean
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined)

interface TenantProviderProps {
    children: ReactNode
    organization: Organization | null
}

/**
 * Provider component that makes organization context available to all client components.
 *
 * This should be used in the root layout and receive the organization from Server Component.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx (Server Component)
 * import { getOrganization } from '@/lib/get-organization'
 * import { TenantProvider } from '@/lib/tenant-context'
 *
 * export default async function RootLayout({ children }) {
 *   const organization = await getOrganization()
 *
 *   return (
 *     <html>
 *       <body>
 *         <TenantProvider organization={organization}>
 *           {children}
 *         </TenantProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function TenantProvider({ children, organization }: TenantProviderProps) {
    return (
        <TenantContext.Provider value={{ organization, isLoading: false }}>
            {children}
        </TenantContext.Provider>
    )
}

/**
 * Hook to access the current organization context in client components.
 *
 * @throws Error if used outside of TenantProvider
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * export function MyComponent() {
 *   const { organization, isLoading } = useTenant()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!organization) return <div>No organization</div>
 *
 *   return <div>Welcome to {organization.name}</div>
 * }
 * ```
 */
export function useTenant(): TenantContextValue {
    const context = useContext(TenantContext)

    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider')
    }

    return context
}
