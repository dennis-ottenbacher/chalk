'use client'

import { useState, Fragment } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { updatePermission } from '@/app/actions/permissions'
import { Check, X, Shield, ChevronDown } from 'lucide-react'

// Types matching the DB
interface RolePermission {
    role: string
    permission_key: string
    access_level: 'true' | 'false' | 'own'
}

interface PermissionDefinition {
    key: string
    name: string
    description: string
}

interface PermissionCategory {
    category: string
    permissions: PermissionDefinition[]
}

// Config: Defines the structure of the table
const permissionStructure: PermissionCategory[] = [
    {
        category: 'General Access',
        permissions: [
            {
                key: 'admin_dashboard.access',
                name: 'Admin Dashboard',
                description: 'Access the backend administration interface',
            },
            {
                key: 'pos.access',
                name: 'POS Interface',
                description: 'Access the Point of Sale system',
            },
        ],
    },
    {
        category: 'User Management',
        permissions: [
            {
                key: 'users.view_all',
                name: 'View All Profiles',
                description: 'View list of all registered users',
            },
            {
                key: 'users.edit',
                name: 'Edit Profiles',
                description: 'Modify user details',
            },
            {
                key: 'users.manage_roles',
                name: 'Manage Roles',
                description: 'Change user roles (promote/demote)',
            },
        ],
    },
    {
        category: 'Product & Inventory',
        permissions: [
            {
                key: 'products.view',
                name: 'View Products',
                description: 'View product catalog',
            },
            {
                key: 'products.manage',
                name: 'Manage Products',
                description: 'Create, edit, and delete products',
            },
        ],
    },
    {
        category: 'Sales & Subscriptions',
        permissions: [
            {
                key: 'sales.view_history',
                name: 'View Sales History',
                description: 'View past transactions',
            },
            {
                key: 'subscriptions.manage',
                name: 'Manage Subscriptions',
                description: 'Modify or cancel member subscriptions',
            },
        ],
    },
    {
        category: 'System',
        permissions: [
            {
                key: 'system.view_logs',
                name: 'View Logs',
                description: 'View system audit logs',
            },
            {
                key: 'system.settings',
                name: 'System Settings',
                description: 'Configure global system settings',
            },
        ],
    },
    {
        category: 'Chalk Bot / AI Agent',
        permissions: [
            {
                key: 'chalk_bot.access',
                name: 'Agent Access',
                description: 'Can access the Chalk Bot interface',
            },
            {
                key: 'chalk_bot.manage_content',
                name: 'Manage Content',
                description: 'Bot can create products and other content',
            },
            {
                key: 'chalk_bot.manage_staff_events',
                name: 'Manage Staff Events',
                description: 'Bot can create absences and shifts',
            },
            {
                key: 'chalk_bot.view_knowledge',
                name: 'View Knowledge Base',
                description: 'Bot can read internal documentation',
            },
        ],
    },
]

const roles = [
    { key: 'admin', label: 'Admin' },
    { key: 'manager', label: 'Manager' },
    { key: 'staff', label: 'Staff' },
    { key: 'member', label: 'Member' },
    { key: 'athlete', label: 'Athlete' },
]

export function PermissionMatrix({ initialPermissions }: { initialPermissions: RolePermission[] }) {
    const [permissions, setPermissions] = useState<RolePermission[]>(initialPermissions)

    const getAccess = (role: string, key: string) => {
        const found = permissions.find(p => p.role === role && p.permission_key === key)
        return found?.access_level || 'false'
    }

    const handleUpdate = async (role: string, key: string, value: 'true' | 'false' | 'own') => {
        // Optimistic update
        const prevPermissions = [...permissions]
        setPermissions(prev => {
            const existingIndex = prev.findIndex(p => p.role === role && p.permission_key === key)
            if (existingIndex >= 0) {
                const updated = [...prev]
                updated[existingIndex] = { ...updated[existingIndex], access_level: value }
                return updated
            }
            return [...prev, { role, permission_key: key, access_level: value }]
        })

        // Server action
        const result = await updatePermission(role, key, value)

        if (result.error) {
            // Revert on failure
            setPermissions(prevPermissions)
            alert(`Error: ${result.error}`)
        }
    }

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Permission</TableHead>
                        {roles.map(role => (
                            <TableHead key={role.key} className="text-center min-w-[100px]">
                                {role.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {permissionStructure.map(category => (
                        <Fragment key={category.category}>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableCell
                                    colSpan={roles.length + 1}
                                    className="py-2 font-semibold text-gray-700"
                                >
                                    {category.category}
                                </TableCell>
                            </TableRow>
                            {category.permissions.map(item => (
                                <TableRow key={item.key}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.name}</span>
                                            <span className="text-xs text-gray-500">
                                                {item.description}
                                            </span>
                                        </div>
                                    </TableCell>
                                    {roles.map(role => {
                                        const access = getAccess(role.key, item.key)
                                        return (
                                            <TableCell key={role.key} className="p-2 text-center">
                                                <AccessSelect
                                                    value={access}
                                                    onChange={val =>
                                                        handleUpdate(
                                                            role.key,
                                                            item.key,
                                                            val as 'true' | 'false' | 'own'
                                                        )
                                                    }
                                                    disabled={role.key === 'admin'} // Admins always have access
                                                />
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function AccessSelect({
    value,
    onChange,
    disabled,
}: {
    value: string
    onChange: (val: string) => void
    disabled?: boolean
}) {
    if (disabled && value === 'true') {
        return (
            <div className="flex justify-center text-gray-400">
                <Check className="h-5 w-5" />
            </div>
        )
    }

    // Custom styled select
    return (
        <div className="relative inline-flex w-full min-w-[130px]">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className="h-9 w-full appearance-none rounded-md border border-gray-200 bg-white pl-9 pr-8 py-1 text-sm text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            >
                <option value="true">Allowed</option>
                <option value="false">Denied</option>
                <option value="own">Own Data</option>
            </select>
            <div className="pointer-events-none absolute right-2 top-2.5 text-gray-400">
                <ChevronDown className="h-4 w-4" />
            </div>

            {/* Visual Indicator Overlay */}
            <div className="pointer-events-none absolute left-2.5 top-2.5">
                {value === 'true' && <Check className="h-4 w-4 text-green-500" />}
                {value === 'false' && <X className="h-4 w-4 text-red-500" />}
                {value === 'own' && <Shield className="h-4 w-4 text-blue-500" />}
            </div>
        </div>
    )
}
