'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    getPaymentConfig,
    updatePaymentConfig,
    getWebhookUrl,
} from '@/app/actions/payment-settings'
import { testMollieConnection, getPaymentStatus } from '@/app/actions/test-mollie'
import { Loader2, CheckCircle, XCircle, CreditCard, RefreshCw, Link, Copy } from 'lucide-react'

interface PaymentSettingsProps {
    initialConfig?: {
        cardProvider: 'standalone' | 'mollie'
        mollieApiKey: string | null
        mollieTestMode: boolean
        mollieEnabled: boolean
    } | null
}

interface PaymentStatusData {
    configured: boolean
    enabled: boolean
    cardProvider: 'standalone' | 'mollie'
    mollieTestMode: boolean
    mollieHasKey: boolean
    availableMethods: string[]
}

export default function PaymentSettings({ initialConfig }: PaymentSettingsProps) {
    const [isPending, startTransition] = useTransition()
    const [testLogs, setTestLogs] = useState<string[]>([])
    const [testSuccess, setTestSuccess] = useState<boolean | null>(null)
    const [status, setStatus] = useState<PaymentStatusData | null>(null)
    const [isLoadingStatus, setIsLoadingStatus] = useState(false)
    const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const [formData, setFormData] = useState({
        cardProvider: initialConfig?.cardProvider || ('standalone' as const),
        mollieApiKey: initialConfig?.mollieApiKey || '',
        mollieTestMode: initialConfig?.mollieTestMode ?? true,
        mollieEnabled: initialConfig?.mollieEnabled ?? false,
    })

    const fetchStatus = useCallback(async () => {
        setIsLoadingStatus(true)
        try {
            const [statusResult, urlResult] = await Promise.all([
                getPaymentStatus(),
                getWebhookUrl(),
            ])
            setStatus(statusResult)
            setWebhookUrl(urlResult)
        } catch {
            setStatus(null)
        } finally {
            setIsLoadingStatus(false)
        }
    }, [])

    useEffect(() => {
        fetchStatus()
    }, [fetchStatus])

    // Reload config from server
    useEffect(() => {
        async function loadConfig() {
            const config = await getPaymentConfig()
            setFormData({
                cardProvider: config.cardProvider,
                mollieApiKey: config.mollieApiKey || '',
                mollieTestMode: config.mollieTestMode,
                mollieEnabled: config.mollieEnabled,
            })
        }
        loadConfig()
    }, [])

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updatePaymentConfig({
                    cardProvider: formData.cardProvider,
                    mollieApiKey: formData.mollieApiKey,
                    mollieTestMode: formData.mollieTestMode,
                    mollieEnabled: formData.mollieEnabled,
                })
                fetchStatus()
                setTestLogs([])
                setTestSuccess(null)
            } catch (error) {
                console.error('Failed to save:', error)
            }
        })
    }

    const handleTest = () => {
        startTransition(async () => {
            setTestLogs([])
            setTestSuccess(null)
            try {
                const result = await testMollieConnection()
                setTestLogs(result.logs)
                setTestSuccess(result.success)
            } catch (error) {
                setTestLogs([
                    '❌ Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
                ])
                setTestSuccess(false)
            }
        })
    }

    const copyWebhookUrl = async () => {
        if (webhookUrl) {
            await navigator.clipboard.writeText(webhookUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="space-y-6">
            {/* Provider Selection Card */}
            <Card className="p-6 bg-card">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-info" />
                    <h3 className="text-lg font-semibold">Zahlungsanbieter</h3>
                </div>

                <p className="text-muted-foreground text-sm mb-6">
                    Wählen Sie den Anbieter für Kartenzahlungen. &quot;Standalone&quot; bedeutet ein
                    externes Terminal ohne Anbindung. &quot;Mollie&quot; ermöglicht
                    Online-Zahlungen.
                </p>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="cardProvider">Kartenzahlung Provider</Label>
                        <select
                            id="cardProvider"
                            value={formData.cardProvider}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    cardProvider: e.target.value as 'standalone' | 'mollie',
                                })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                        >
                            <option value="standalone">Standalone (externes Terminal)</option>
                            <option value="mollie">Mollie (Online-Zahlungen)</option>
                        </select>
                    </div>

                    {/* Status Display */}
                    {status && (
                        <div className="p-4 rounded-lg bg-muted border border-border">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Provider:</span>
                                    <span className="font-medium">
                                        {status.cardProvider === 'mollie' ? 'Mollie' : 'Standalone'}
                                    </span>
                                </div>
                                {status.cardProvider === 'mollie' && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">
                                                Status:
                                            </span>
                                            {status.enabled ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Aktiv
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/15 text-warning">
                                                    <XCircle className="h-3 w-3" />
                                                    Inaktiv
                                                </span>
                                            )}
                                        </div>
                                        {status.availableMethods.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    Methoden:
                                                </span>
                                                <span className="text-sm">
                                                    {status.availableMethods.join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Mollie Configuration (only when Mollie selected) */}
            {formData.cardProvider === 'mollie' && (
                <Card className="p-6 bg-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                                Mollie
                            </span>
                            <h3 className="text-lg font-semibold">Mollie Konfiguration</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchStatus}
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

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="mollieApiKey">API Key</Label>
                                <Input
                                    id="mollieApiKey"
                                    type="password"
                                    value={formData.mollieApiKey}
                                    onChange={e =>
                                        setFormData({ ...formData, mollieApiKey: e.target.value })
                                    }
                                    placeholder="test_... oder live_..."
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    API Key aus dem Mollie Dashboard
                                </p>
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="testMode"
                                        checked={formData.mollieTestMode}
                                        onCheckedChange={checked =>
                                            setFormData({ ...formData, mollieTestMode: checked })
                                        }
                                    />
                                    <Label htmlFor="testMode">Test Mode</Label>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formData.mollieTestMode
                                        ? 'Keine echten Zahlungen'
                                        : 'Live-Zahlungen aktiv!'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="mollieEnabled"
                                checked={formData.mollieEnabled}
                                onCheckedChange={checked =>
                                    setFormData({ ...formData, mollieEnabled: checked })
                                }
                            />
                            <Label htmlFor="mollieEnabled">Mollie aktivieren</Label>
                        </div>

                        {/* Webhook URL */}
                        {webhookUrl && (
                            <div>
                                <Label>Webhook URL</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                                        <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <code className="text-sm truncate">{webhookUrl}</code>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                                        {copied ? (
                                            <CheckCircle className="h-4 w-4 text-success" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tragen Sie diese URL im Mollie Dashboard als Webhook ein
                                </p>
                            </div>
                        )}

                        {/* Test Result Display */}
                        {testLogs.length > 0 && (
                            <div className="p-4 rounded-lg bg-sidebar font-mono text-sm max-h-60 overflow-y-auto">
                                {testLogs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={
                                            log.startsWith('❌')
                                                ? 'text-destructive'
                                                : log.startsWith('✅')
                                                  ? 'text-success'
                                                  : 'text-foreground'
                                        }
                                    >
                                        {log}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button onClick={handleSave} disabled={isPending}>
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Speichern'
                                )}
                            </Button>
                            <Button
                                onClick={handleTest}
                                disabled={isPending || !formData.mollieApiKey}
                                variant="outline"
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Verbindung testen'
                                )}
                            </Button>
                        </div>

                        {/* Success/Error Summary */}
                        {testSuccess !== null && (
                            <div
                                className={`flex items-center gap-2 p-3 rounded-md ${
                                    testSuccess
                                        ? 'bg-success/15 text-success'
                                        : 'bg-destructive/15 text-destructive'
                                }`}
                            >
                                {testSuccess ? (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        <span>Mollie Verbindung erfolgreich!</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5" />
                                        <span>Verbindungstest fehlgeschlagen</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Standalone Info (when Standalone selected) */}
            {formData.cardProvider === 'standalone' && (
                <Card className="p-6 bg-card">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Standalone Terminal</h3>
                    </div>

                    <p className="text-muted-foreground text-sm">
                        Im Standalone-Modus wird davon ausgegangen, dass Sie ein separates
                        Kartenterminal verwenden, das nicht mit der Kasse verbunden ist.
                        Kartenzahlungen werden im POS als &quot;Card&quot; markiert, aber die
                        Zahlungsabwicklung erfolgt extern.
                    </p>

                    <div className="flex gap-3 mt-4">
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}
