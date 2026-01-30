'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    saveTseConfig,
    testTseConnection,
    deactivateTse,
    exportDSFinVK,
    getTssStatus,
    initializeTss,
    disableTss,
} from '@/app/actions/tse'
import {
    Loader2,
    CheckCircle,
    XCircle,
    Download,
    Shield,
    RefreshCw,
    AlertTriangle,
    Power,
} from 'lucide-react'

interface TseSettingsProps {
    initialConfig?: {
        id: string
        tss_id: string
        client_id: string
        is_active: boolean
        environment: 'sandbox' | 'production'
        has_api_key?: boolean
        has_api_secret?: boolean
        has_admin_pin?: boolean
    } | null
}

interface TssStatusData {
    configured: boolean
    tssState?: string
    clientRegistered?: boolean
    environment?: string
    error?: string
}

export default function TseSettings({ initialConfig }: TseSettingsProps) {
    const [isPending, startTransition] = useTransition()
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [tssStatus, setTssStatus] = useState<TssStatusData | null>(null)
    const [initLogs, setInitLogs] = useState<string[]>([])
    const [isInitializing, setIsInitializing] = useState(false)
    const [isLoadingStatus, setIsLoadingStatus] = useState(false)

    const [formData, setFormData] = useState({
        api_key: initialConfig?.has_api_key ? '*****' : '',
        api_secret: initialConfig?.has_api_secret ? '*****' : '',
        tss_id: initialConfig?.tss_id || '',
        client_id: initialConfig?.client_id || '',
        admin_pin: initialConfig?.has_admin_pin ? '*****' : '',
        environment: (initialConfig?.environment || 'production') as 'sandbox' | 'production',
    })

    const [exportDates, setExportDates] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    })

    const fetchTssStatus = async () => {
        setIsLoadingStatus(true)
        try {
            const status = await getTssStatus()
            setTssStatus(status)
        } catch {
            setTssStatus({ configured: false })
        } finally {
            setIsLoadingStatus(false)
        }
    }

    const handleInitialize = async () => {
        setIsInitializing(true)
        setInitLogs([])
        try {
            const result = await initializeTss()
            setInitLogs(result.logs)
            if (result.success) {
                fetchTssStatus()
            }
        } catch (error) {
            setInitLogs([
                '❌ Fehler: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'),
            ])
        } finally {
            setIsInitializing(false)
        }
    }

    const handleDisable = async () => {
        if (
            !confirm(
                'Sind Sie sicher, dass Sie die TSS deaktivieren möchten? Dies kann nicht rückgängig gemacht werden!'
            )
        ) {
            return
        }
        try {
            const result = await disableTss()
            if (result.success) {
                alert('TSS erfolgreich deaktiviert')
                fetchTssStatus()
            } else {
                alert('Fehler: ' + result.message)
            }
        } catch (error) {
            alert('Fehler: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'))
        }
    }

    const handleSave = () => {
        startTransition(async () => {
            try {
                await saveTseConfig(formData)
                alert('TSE configuration saved successfully!')
                setTestResult(null)
            } catch (error) {
                alert(
                    'Failed to save TSE configuration: ' +
                        (error instanceof Error ? error.message : 'Unknown error')
                )
            }
        })
    }

    const handleTest = () => {
        startTransition(async () => {
            try {
                const result = await testTseConnection()
                setTestResult(result)
            } catch (error) {
                setTestResult({
                    success: false,
                    message: error instanceof Error ? error.message : 'Test failed',
                })
            }
        })
    }

    const handleDeactivate = () => {
        if (
            !confirm(
                'Are you sure you want to deactivate TSE? This will stop signing new transactions.'
            )
        ) {
            return
        }

        startTransition(async () => {
            try {
                await deactivateTse()
                alert('TSE deactivated successfully')
            } catch (error) {
                alert(
                    'Failed to deactivate TSE: ' +
                        (error instanceof Error ? error.message : 'Unknown error')
                )
            }
        })
    }

    const handleExport = () => {
        startTransition(async () => {
            try {
                const result = await exportDSFinVK(exportDates.startDate, exportDates.endDate)

                // Download the file
                const blob = new Blob([Uint8Array.from(atob(result.data), c => c.charCodeAt(0))], {
                    type: 'application/x-tar',
                })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = result.filename
                a.click()
                URL.revokeObjectURL(url)
            } catch (error) {
                alert(
                    'Export failed: ' + (error instanceof Error ? error.message : 'Unknown error')
                )
            }
        })
    }

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">TSE Configuration</h3>
                </div>

                <p className="text-muted-foreground text-sm mb-6">
                    Configure fiskaly Cloud TSE for German fiscal compliance (KassenSichV). All
                    transactions will be cryptographically signed.
                </p>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="api_key">API Key</Label>
                            <Input
                                id="api_key"
                                type="password"
                                value={formData.api_key}
                                onChange={e =>
                                    setFormData({ ...formData, api_key: e.target.value })
                                }
                                placeholder="Enter fiskaly API key"
                            />
                        </div>
                        <div>
                            <Label htmlFor="api_secret">API Secret</Label>
                            <Input
                                id="api_secret"
                                type="password"
                                value={formData.api_secret}
                                onChange={e =>
                                    setFormData({ ...formData, api_secret: e.target.value })
                                }
                                placeholder="Enter fiskaly API secret"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="tss_id">TSS ID</Label>
                            <Input
                                id="tss_id"
                                value={formData.tss_id}
                                onChange={e => setFormData({ ...formData, tss_id: e.target.value })}
                                placeholder="Technical Security System ID"
                            />
                        </div>
                        <div>
                            <Label htmlFor="client_id">Client ID</Label>
                            <Input
                                id="client_id"
                                value={formData.client_id}
                                onChange={e =>
                                    setFormData({ ...formData, client_id: e.target.value })
                                }
                                placeholder="Client ID"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="admin_pin">Admin PIN</Label>
                            <Input
                                id="admin_pin"
                                type="password"
                                value={formData.admin_pin}
                                onChange={e =>
                                    setFormData({ ...formData, admin_pin: e.target.value })
                                }
                                placeholder="TSS Admin PIN from Fiskaly Dashboard"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Required for TSS initialization. Find this in the Fiskaly Dashboard.
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="environment">Environment</Label>
                            <select
                                id="environment"
                                value={formData.environment}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        environment: e.target.value as 'sandbox' | 'production',
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="sandbox">Sandbox (Testing)</option>
                                <option value="production">Production</option>
                            </select>
                        </div>
                    </div>

                    {testResult && (
                        <div
                            className={`flex items-center gap-2 p-3 rounded-md ${
                                testResult.success
                                    ? 'bg-green-900/20 text-green-400'
                                    : 'bg-red-900/20 text-red-400'
                            }`}
                        >
                            {testResult.success ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <XCircle className="h-5 w-5" />
                            )}
                            <span>{testResult.message}</span>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Save Configuration'
                            )}
                        </Button>
                        <Button onClick={handleTest} disabled={isPending} variant="outline">
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Test Connection'
                            )}
                        </Button>
                        {initialConfig?.is_active && (
                            <Button
                                onClick={handleDeactivate}
                                disabled={isPending}
                                variant="destructive"
                            >
                                Deactivate TSE
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* TSS Management Card */}
            {initialConfig && (
                <Card className="p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Power className="h-5 w-5 text-purple-600" />
                            <h3 className="text-lg font-semibold">TSS Management</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchTssStatus}
                            disabled={isLoadingStatus}
                        >
                            {isLoadingStatus ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Status laden
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Status Display */}
                    {tssStatus && (
                        <div className="mb-4 p-4 rounded-lg bg-gray-50 border">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">TSS Status:</span>
                                    {tssStatus.tssState === 'INITIALIZED' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="h-3 w-3" />
                                            INITIALIZED
                                        </span>
                                    ) : tssStatus.tssState === 'DISABLED' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <XCircle className="h-3 w-3" />
                                            DISABLED
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            <AlertTriangle className="h-3 w-3" />
                                            {tssStatus.tssState || 'UNKNOWN'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Client:</span>
                                    {tssStatus.clientRegistered ? (
                                        <span className="text-sm text-green-600">
                                            Registriert ✓
                                        </span>
                                    ) : (
                                        <span className="text-sm text-yellow-600">
                                            Nicht registriert
                                        </span>
                                    )}
                                </div>
                                {tssStatus.error && (
                                    <span className="text-sm text-red-600">{tssStatus.error}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 flex-wrap">
                        {(!tssStatus || tssStatus.tssState !== 'INITIALIZED') && (
                            <Button
                                onClick={handleInitialize}
                                disabled={isInitializing}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {isInitializing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Initialisiere...
                                    </>
                                ) : (
                                    'TSS Initialisieren'
                                )}
                            </Button>
                        )}
                        {tssStatus?.tssState === 'INITIALIZED' && (
                            <Button onClick={handleDisable} variant="destructive">
                                TSS Deaktivieren
                            </Button>
                        )}
                    </div>

                    {/* Progress Logs */}
                    {initLogs.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg bg-gray-900 text-green-400 font-mono text-sm max-h-60 overflow-y-auto">
                            {initLogs.map((log, index) => (
                                <div
                                    key={index}
                                    className={log.startsWith('❌') ? 'text-red-400' : ''}
                                >
                                    {log}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {initialConfig?.is_active && (
                <Card className="p-6 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                        <Download className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-lg font-semibold">DSFinV-K Export</h3>
                    </div>

                    <p className="text-muted-foreground text-sm mb-6">
                        Export transaction data in DSFinV-K format for tax audits (Betriebsprüfung).
                    </p>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={exportDates.startDate}
                                    onChange={e =>
                                        setExportDates({
                                            ...exportDates,
                                            startDate: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="end_date">End Date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={exportDates.endDate}
                                    onChange={e =>
                                        setExportDates({ ...exportDates, endDate: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <Button onClick={handleExport} disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export DSFinV-K
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}
