'use client'

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/lib/store/cartStore'
import {
    CreditCard,
    Banknote,
    Loader2,
    Ticket,
    ArrowLeft,
    CheckCircle2,
    XCircle,
} from 'lucide-react'
import { useState, useTransition } from 'react'
import { createTransaction } from '@/app/actions/transactions'
import { validateVoucher, VoucherValidationResult } from '@/app/actions/vouchers'

interface CheckoutDialogProps {
    settings?: {
        pos_direct_checkout: boolean
    } | null
}

export default function CheckoutDialog({ settings }: CheckoutDialogProps) {
    const clearCart = useCartStore(state => state.clearCart)
    const getTotal = useCartStore(state => state.getTotal)
    const items = useCartStore(state => state.items)
    const applyVoucher = useCartStore(state => state.applyVoucher)
    const appliedVoucher = useCartStore(state => state.appliedVoucher)
    // Subscribe to discount changes to ensure total updates
    useCartStore(state => state.discountValue)
    useCartStore(state => state.discountType)

    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Voucher State
    const [paymentMode, setPaymentMode] = useState<'select' | 'voucher'>('select')
    const [voucherCode, setVoucherCode] = useState('')
    const [checkingVoucher, setCheckingVoucher] = useState(false)
    const [voucherResult, setVoucherResult] = useState<VoucherValidationResult | null>(null)

    // Check if cart contains plans without assigned members
    const missingMember = items.some(item => item.type === 'plan' && !item.assignedMember)

    // If cart is empty, disable checkout
    // Also disable if plan is in cart but no member selected for it
    const disabled = items.length === 0 || missingMember

    const resetState = () => {
        setPaymentMode('select')
        setVoucherCode('')
        setVoucherResult(null)
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) {
            setTimeout(resetState, 300)
        }
    }

    const handleCheckout = (method: 'cash' | 'card') => {
        startTransition(async () => {
            try {
                await createTransaction({
                    items: items.map(item => {
                        return {
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            type: item.type,
                            duration_months: item.duration_months,
                            credits_amount: item.credits_amount,
                            recurring_interval: item.recurring_interval,
                            member_id: item.assignedMember?.id,
                            voucher_code: item.voucherCode || undefined,
                        }
                    }),
                    totalAmount: getTotal(),
                    paymentMethod: method,
                    memberId: null,
                    appliedVoucher: appliedVoucher
                        ? {
                              code: appliedVoucher.code,
                              amount: appliedVoucher.amount,
                          }
                        : undefined,
                })
                clearCart()
                setIsOpen(false)
                resetState()
            } catch (error) {
                console.error('Checkout failed:', error)
            }
        })
    }

    const handleCheckVoucher = async () => {
        if (!voucherCode) return
        setCheckingVoucher(true)
        setVoucherResult(null)
        try {
            const result = await validateVoucher(voucherCode)
            setVoucherResult(result)
        } catch (error) {
            console.error(error)
            setVoucherResult({ valid: false, message: 'System error checking voucher' })
        } finally {
            setCheckingVoucher(false)
        }
    }

    const handleVoucherPay = () => {
        if (!voucherResult?.valid || !voucherResult.voucher) return

        const total = getTotal()
        const balance = voucherResult.voucher.remaining_amount

        if (balance < total) {
            // Split payment flow
            applyVoucher(voucherResult.voucher.code, balance)
            setIsOpen(false)
            resetState()
            return
        }

        startTransition(async () => {
            try {
                await createTransaction({
                    items: items.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        type: item.type,
                        duration_months: item.duration_months,
                        credits_amount: item.credits_amount,
                        recurring_interval: item.recurring_interval,
                        member_id: item.assignedMember?.id,
                        voucher_code: item.voucherCode || undefined,
                    })),
                    totalAmount: getTotal(),
                    paymentMethod: 'voucher',
                    voucherCode: voucherResult.voucher!.code,
                    memberId: null,
                })
                clearCart()
                setIsOpen(false)
                resetState()
            } catch (error) {
                console.error('Voucher Checkout failed:', error)
                setVoucherResult({ valid: false, message: 'Transaction failed. Please try again.' })
            }
        })
    }

    const renderDialogContent = () => {
        if (paymentMode === 'voucher') {
            const total = getTotal()
            const balance = voucherResult?.voucher?.remaining_amount || 0
            const sufficient = balance >= total

            return (
                <div className="flex flex-col gap-4 w-full">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPaymentMode('select')}
                                className="-ml-2 h-8 w-8"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <AlertDialogTitle>Pay with Voucher</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            Enter the voucher code below.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-2 space-y-4">
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="V-XXXX-XXXX"
                                    value={voucherCode}
                                    onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                                    className="text-lg font-mono placeholder:font-sans uppercase h-12"
                                    onKeyDown={e => e.key === 'Enter' && handleCheckVoucher()}
                                    autoFocus
                                />
                                <Button
                                    onClick={handleCheckVoucher}
                                    disabled={checkingVoucher || !voucherCode}
                                    size="lg"
                                    className="h-12 bg-gray-900 text-white hover:bg-gray-800"
                                >
                                    {checkingVoucher ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Check'
                                    )}
                                </Button>
                            </div>
                        </div>

                        {voucherResult && (
                            <div
                                className={`p-4 rounded-lg border ${voucherResult.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} transition-all`}
                            >
                                <div className="flex items-start gap-3">
                                    {voucherResult.valid ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                    )}
                                    <div className="space-y-1 w-full">
                                        <p
                                            className={`font-medium ${voucherResult.valid ? 'text-emerald-900' : 'text-red-900'}`}
                                        >
                                            {voucherResult.valid
                                                ? 'Voucher Valid'
                                                : 'Invalid Voucher'}
                                        </p>
                                        {voucherResult.message && (
                                            <p
                                                className={`text-sm ${voucherResult.valid ? 'text-emerald-700' : 'text-red-700'}`}
                                            >
                                                {voucherResult.message}
                                            </p>
                                        )}
                                        {voucherResult.valid && voucherResult.voucher && (
                                            <div className="mt-2 text-sm text-emerald-800 flex flex-col gap-1 w-full">
                                                <div className="flex justify-between w-full">
                                                    <span>Balance:</span>
                                                    <span className="font-mono font-bold">
                                                        €
                                                        {voucherResult.voucher.remaining_amount.toFixed(
                                                            2
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between w-full">
                                                    <span>Cart Total:</span>
                                                    <span>€{total.toFixed(2)}</span>
                                                </div>
                                                <div className="border-t border-emerald-200 my-1 pt-1 flex justify-between w-full font-bold">
                                                    <span>Remaining after:</span>
                                                    <span
                                                        className={`${balance - total < 0 ? 'text-red-600' : 'text-emerald-700'}`}
                                                    >
                                                        {balance - total < 0
                                                            ? '€0.00'
                                                            : `€${(balance - total).toFixed(2)}`}
                                                    </span>
                                                </div>
                                                {!sufficient && (
                                                    <p className="text-emerald-700 font-bold mt-1 text-xs">
                                                        Voucher will be applied as discount. Left to
                                                        pay: €{(total - balance).toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                            className="h-12 text-base"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6"
                            disabled={!voucherResult?.valid || !voucherResult?.voucher || isPending}
                            onClick={handleVoucherPay}
                        >
                            {isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <Ticket className="h-5 w-5 mr-2" />
                            )}
                            {sufficient
                                ? `Pay €${total.toFixed(2)}`
                                : `Redeem €${balance.toFixed(2)} & Pay Rest`}
                        </Button>
                    </AlertDialogFooter>
                </div>
            )
        }

        return (
            <>
                <AlertDialogHeader>
                    <AlertDialogTitle>Payment Method</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-500">
                        Total Amount:{' '}
                        <span className="text-emerald-600 font-bold">€{getTotal().toFixed(2)}</span>
                        <br />
                        Select how the member wants to pay.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid grid-cols-1 gap-3 py-4">
                    <Button
                        variant="outline"
                        className="h-16 text-lg border-gray-200 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-start px-6 gap-3 shadow-sm"
                        onClick={() => handleCheckout('card')}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <CreditCard className="h-6 w-6 text-blue-600" />
                        )}
                        <span>Card (Terminal)</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-16 text-lg border-gray-200 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-start px-6 gap-3 shadow-sm"
                        onClick={() => handleCheckout('cash')}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Banknote className="h-6 w-6 text-emerald-600" />
                        )}
                        <span>Cash</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-16 text-lg border-gray-200 hover:bg-purple-50 hover:text-purple-900 hover:border-purple-200 flex items-center justify-start px-6 gap-3 shadow-sm text-purple-700"
                        onClick={() => setPaymentMode('voucher')}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Ticket className="h-6 w-6 text-purple-600" />
                        )}
                        <span>Voucher Code</span>
                    </Button>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        className="bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-200"
                        disabled={isPending}
                    >
                        Cancel
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </>
        )
    }

    if (settings?.pos_direct_checkout) {
        return (
            <div className="w-full space-y-2">
                {missingMember && (
                    <p className="text-red-400 text-sm text-center font-bold animate-pulse">
                        ⚠️ Subscription Plan requires a Customer!
                    </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-1 border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 transition-all shadow-sm"
                        onClick={() => handleCheckout('cash')}
                        disabled={disabled || isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Banknote className="h-8 w-8 text-emerald-600" />
                        )}
                        <span className="font-bold">Cash</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-1 border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 text-gray-700 transition-all shadow-sm"
                        onClick={() => handleCheckout('card')}
                        disabled={disabled || isPending}
                    >
                        {isPending ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <CreditCard className="h-8 w-8 text-blue-600" />
                        )}
                        <span className="font-bold">Card</span>
                    </Button>
                </div>
                {/* Direct Checkout doesn't support Voucher dialog flow easily without opening the dialog anyway. 
                    So we probably should add a Voucher button here too that OPENS the dialog? 
                    For now, I'll leave Direct Checkout as is for Cash/Card and rely on the Main Checkout Button for special flows, 
                    OR add a small "More..." or "Voucher" button here.
                    The requirement implies standard POS flow. 
                    I'll add a full width Voucher button below functionality if Direct Checkout is ON. 
                 */}
                <Button
                    variant="ghost"
                    className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    onClick={() => setIsOpen(true)} // Open main dialog for Voucher
                    disabled={disabled || isPending}
                >
                    <Ticket className="w-4 h-4 mr-2" />
                    Use Voucher / More Options
                </Button>

                <div className="flex justify-between items-center px-1">
                    <span className="text-sm text-gray-500 font-medium">Total to pay</span>
                    <span className="text-xl font-bold text-emerald-600">
                        €{getTotal().toFixed(2)}
                    </span>
                </div>

                {/* Hidden Dialog for Voucher Flow when triggered */}
                <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
                    <AlertDialogContent className="bg-white border-gray-200 text-gray-900 shadow-xl sm:max-w-md transition-all duration-200">
                        {/* Reuse the dialog content logic below */}
                        {renderDialogContent()}
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )
    }

    return (
        <div className="w-full">
            {missingMember && (
                <p className="text-red-400 text-sm mb-2 text-center font-bold">
                    ⚠️ Subscription Plan requires a Customer!
                </p>
            )}
            <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
                <AlertDialogTrigger asChild>
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6"
                        disabled={disabled}
                    >
                        Checkout €{getTotal().toFixed(2)}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border-gray-200 text-gray-900 shadow-xl sm:max-w-md transition-all duration-200">
                    {renderDialogContent()}
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
