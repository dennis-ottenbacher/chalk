'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { debugTseConfiguration } from '@/app/actions/debug-tse'
import { testFiskalyDirectly } from '@/app/actions/test-fiskaly'

export default function TseDebugPage() {
    const [logs, setLogs] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const runTest = async () => {
        setLoading(true)
        setLogs(['Running TSE debug test...'])

        try {
            const result = await debugTseConfiguration()
            setLogs(result.logs)
        } catch (error) {
            setLogs([`Error: ${error instanceof Error ? error.message : String(error)}`])
        } finally {
            setLoading(false)
        }
    }

    const runDirectTest = async () => {
        setLoading(true)
        setLogs(['Running direct Fiskaly API test...'])

        try {
            const result = await testFiskalyDirectly()
            setLogs(result.logs)
        } catch (error) {
            setLogs([`Error: ${error instanceof Error ? error.message : String(error)}`])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">TSE Debug</h1>

            <div className="flex gap-3 mb-4">
                <Button onClick={runTest} disabled={loading}>
                    {loading ? 'Testing...' : 'Run TSE Manager Test'}
                </Button>

                <Button onClick={runDirectTest} disabled={loading} variant="outline">
                    {loading ? 'Testing...' : 'Run Direct API Test'}
                </Button>
            </div>

            {logs.length > 0 && (
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-[600px]">
                    {logs.map((log, i) => (
                        <div key={i} className="whitespace-pre-wrap">
                            {log}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
