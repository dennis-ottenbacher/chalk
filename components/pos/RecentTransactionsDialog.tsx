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
                    className="border-border hover:bg-muted text-foreground gap-2 shadow-sm"
                >
                    <History className="h-4 w-4" />
                    Transactions
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border text-foreground sm:max-w-[75%] flex flex-col max-h-[85vh] shadow-xl">
                <AlertDialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
                    <AlertDialogTitle className="text-xl">Recent Transactions</AlertDialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchTransactions}
                        disabled={loading}
                        className="ml-auto text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </AlertDialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {transactions.length === 0 && !loading && (
                        <div className="text-center text-muted-foreground py-10">
                            No recent transactions found
                        </div>
                    )}

                    {transactions.map(tx => (
                        <div
                            key={tx.id}
                            className="bg-muted rounded-lg p-4 border border-border flex flex-col sm:flex-row justify-between gap-4"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            tx.status === 'completed'
                                                ? 'bg-success/15 text-success'
                                                : tx.status === 'cancelled'
                                                  ? 'bg-destructive/15 text-destructive'
                                                  : 'bg-info/15 text-info'
                                        }`}
                                    >
                                        {tx.status.toUpperCase()}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        {new Intl.DateTimeFormat('de-DE', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        }).format(new Date(tx.created_at))}
                                    </span>
                                </div>
                                <div className="font-medium text-foreground">
                                    €{Number(tx.total_amount).toFixed(2)}
                                    <span className="text-muted-foreground mx-2">•</span>
                                    <span
                                        className={
                                            tx.payment_method === 'cash'
                                                ? 'text-success'
                                                : tx.payment_method === 'voucher'
                                                  ? 'text-primary'
                                                  : 'text-info'
                                        }
                                    >
                                        {tx.payment_method === 'cash'
                                            ? 'Cash'
                                            : tx.payment_method === 'voucher'
                                              ? 'Voucher'
                                              : 'Card'}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground max-w-md">
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

                <AlertDialogFooter className="border-t border-border pt-4">
                    <AlertDialogCancel className="bg-muted text-foreground hover:bg-accent border-border">
                        Close
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
