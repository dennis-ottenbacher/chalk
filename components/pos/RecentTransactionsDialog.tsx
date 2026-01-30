'use client'

import { useState, useTransition, useEffect } from 'react'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { History, RefreshCw, Loader2 } from 'lucide-react'
import { Transaction, getRecentTransactions, cancelTransaction } from '@/app/actions/transactions'

export default function RecentTransactionsDialog() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isCancelling, startTransition] = useTransition()

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            const data = await getRecentTransactions()
            setTransactions(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch when dialog opens
    useEffect(() => {
        if (isOpen) {
            fetchTransactions()
        }
    }, [isOpen])

    const handleCancel = (id: string) => {
        startTransition(async () => {
            try {
                await cancelTransaction(id)
                // Refresh list
                await fetchTransactions()
            } catch (e) {
                console.error(e)
            }
        })
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-gray-200 hover:bg-gray-100 text-gray-700 gap-2 shadow-sm"
                >
                    <History className="h-4 w-4" />
                    Transactions
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-[75%] flex flex-col max-h-[85vh] shadow-xl">
                <AlertDialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200">
                    <AlertDialogTitle className="text-xl">Recent Transactions</AlertDialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchTransactions}
                        disabled={loading}
                        className="ml-auto text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </AlertDialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {transactions.length === 0 && !loading && (
                        <div className="text-center text-slate-500 py-10">
                            No recent transactions found
                        </div>
                    )}

                    {transactions.map(tx => (
                        <div
                            key={tx.id}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col sm:flex-row justify-between gap-4"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            tx.status === 'completed'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : tx.status === 'cancelled'
                                                  ? 'bg-red-100 text-red-700'
                                                  : 'bg-blue-100 text-blue-700'
                                        }`}
                                    >
                                        {tx.status.toUpperCase()}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                        {new Intl.DateTimeFormat('de-DE', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        }).format(new Date(tx.created_at))}
                                    </span>
                                </div>
                                <div className="font-medium text-gray-900">
                                    €{Number(tx.total_amount).toFixed(2)}
                                    <span className="text-gray-400 mx-2">•</span>
                                    <span
                                        className={
                                            tx.payment_method === 'cash'
                                                ? 'text-green-600'
                                                : tx.payment_method === 'voucher'
                                                  ? 'text-purple-600'
                                                  : 'text-blue-600'
                                        }
                                    >
                                        {tx.payment_method === 'cash'
                                            ? 'Cash'
                                            : tx.payment_method === 'voucher'
                                              ? 'Voucher'
                                              : 'Card'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 max-w-md">
                                    {tx.items &&
                                        Array.isArray(tx.items) &&
                                        tx.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </div>
                            </div>

                            <div className="flex items-center">
                                {tx.status === 'completed' && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleCancel(tx.id)}
                                        disabled={isCancelling}
                                        className="w-full sm:w-auto"
                                    >
                                        {isCancelling ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Cancel'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <AlertDialogFooter className="border-t border-gray-200 pt-4">
                    <AlertDialogCancel className="bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-200">
                        Close
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
