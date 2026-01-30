'use client'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/lib/store/cartStore'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus } from 'lucide-react'
import CheckoutDialog from './CheckoutDialog'
import { MemberSearch } from './MemberSearch'
import SavedCartsManager from './SavedCartsManager'
import { useEffect, memo } from 'react'
import { CartItem } from '@/lib/store/cartStore'

interface CartSidebarProps {
    settings?: {
        pos_direct_checkout: boolean
    } | null
}

export default function CartSidebar({ settings }: CartSidebarProps) {
    const items = useCartStore(state => state.items)
    const removeItem = useCartStore(state => state.removeItem)
    const updateQuantity = useCartStore(state => state.updateQuantity)
    const clearCart = useCartStore(state => state.clearCart)
    const discountType = useCartStore(state => state.discountType)
    const discountValue = useCartStore(state => state.discountValue)
    const setDiscount = useCartStore(state => state.setDiscount)
    const getSubtotal = useCartStore(state => state.getSubtotal)
    const getTotal = useCartStore(state => state.getTotal)
    const appliedVoucher = useCartStore(state => state.appliedVoucher)
    const clearVoucher = useCartStore(state => state.clearVoucher)
    const setItemMember = useCartStore(state => state.setItemMember)
    const setItemVoucherCode = useCartStore(state => state.setItemVoucherCode)

    const subtotal = getSubtotal()
    const total = getTotal()

    // Calculate specific discount amounts for display
    let afterGeneralDiscount = subtotal
    if (discountValue > 0) {
        if (discountType === 'absolute') {
            afterGeneralDiscount = Math.max(0, subtotal - discountValue)
        } else {
            afterGeneralDiscount = Math.max(0, subtotal * (1 - discountValue / 100))
        }
    }
    const generalDiscountAmount = subtotal - afterGeneralDiscount

    // Calculate effective voucher discount
    const voucherDiscountAmount = appliedVoucher
        ? Math.max(0, afterGeneralDiscount - total) // total is already final, so diff is what voucher covered
        : 0

    // Heal cart items that are missing cartId (migration for existing carts)
    useEffect(() => {
        const itemsWithoutId = items.some(item => !item.cartId)
        if (itemsWithoutId) {
            useCartStore.setState(state => ({
                items: state.items.map(item => ({
                    ...item,
                    cartId:
                        item.cartId ||
                        (typeof crypto !== 'undefined' && crypto.randomUUID
                            ? crypto.randomUUID()
                            : Math.random().toString(36).substring(2) + Date.now().toString(36)),
                })),
            }))
        }
    }, [items])

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full md:w-96 shadow-xl">
            <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={clearCart}
                        disabled={items.length === 0}
                    >
                        Clear
                    </Button>
                </div>
                <div className="flex justify-end w-full">
                    <SavedCartsManager />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 italic">
                        <p>Cart is empty</p>
                        <p className="text-sm">Add items from the grid</p>
                    </div>
                ) : (
                    items.map((item, index) => (
                        <CartItemRow
                            key={item.cartId || `fallback-${index}`}
                            item={item}
                            updateQuantity={updateQuantity}
                            removeItem={removeItem}
                            setItemMember={setItemMember}
                            setItemVoucherCode={setItemVoucherCode}
                        />
                    ))
                )}
            </div>

            <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Discount
                    </label>
                    <div className="flex gap-2">
                        <div className="flex bg-gray-100 rounded-md p-1 border border-gray-200 shrink-0">
                            <Button
                                variant={discountType === 'absolute' ? 'secondary' : 'ghost'}
                                className={`h-8 w-10 text-sm font-bold ${discountType === 'absolute' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                                onClick={() => setDiscount('absolute', discountValue)}
                            >
                                €
                            </Button>
                            <Button
                                variant={discountType === 'percentage' ? 'secondary' : 'ghost'}
                                className={`h-8 w-10 text-sm font-bold ${discountType === 'percentage' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                                onClick={() => setDiscount('percentage', discountValue)}
                            >
                                %
                            </Button>
                        </div>
                        <Input
                            type="number"
                            min="0"
                            value={discountValue === 0 ? '' : discountValue}
                            onChange={e =>
                                setDiscount(discountType, parseFloat(e.target.value) || 0)
                            }
                            className="h-10 text-base font-bold text-center bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-500 placeholder:text-gray-400"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    {generalDiscountAmount > 0 && (
                        <div className="flex justify-between text-sm text-red-500">
                            <span>
                                Discount (
                                {discountType === 'percentage'
                                    ? `${discountValue}%`
                                    : `€${discountValue}`}
                                )
                            </span>
                            <span>-€{generalDiscountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    {appliedVoucher && (
                        <div className="flex justify-between text-sm text-emerald-600 font-medium">
                            <div className="flex items-center gap-1">
                                <span>Voucher ({appliedVoucher.code})</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 hover:bg-emerald-100 rounded-full"
                                    onClick={clearVoucher}
                                    title="Remove Voucher"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <span>-€{voucherDiscountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
                        <span>Total</span>
                        <span className="text-emerald-600">€{total.toFixed(2)}</span>
                    </div>
                </div>

                <CheckoutDialog settings={settings} />
            </div>
        </div>
    )
}

const CartItemRow = memo(
    ({
        item,
        updateQuantity,
        removeItem,
        setItemMember,
        setItemVoucherCode,
    }: {
        item: CartItem
        updateQuantity: (id: string, q: number) => void
        removeItem: (id: string) => void
        setItemMember: (id: string, m: { id: string; name: string } | null) => void
        setItemVoucherCode: (id: string, code: string) => void
    }) => {
        return (
            <div className="flex flex-col bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900 line-clamp-1">{item.name}</span>
                    <span className="font-bold text-emerald-600 shrink-0 ml-2">
                        €{(item.price * item.quantity).toFixed(2)}
                    </span>
                </div>

                {/* Member Search for Plan items */}
                {item.type === 'plan' && (
                    <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1 ml-1 uppercase tracking-wider font-semibold">
                            Assign to Member
                        </div>
                        <MemberSearch
                            compact
                            placeholder="Assign member..."
                            selectedMember={item.assignedMember}
                            onSelect={member =>
                                setItemMember(item.cartId, {
                                    id: member.id,
                                    name: `${member.first_name} ${member.last_name}`,
                                })
                            }
                            onClear={() => setItemMember(item.cartId, null)}
                        />
                        {!item.assignedMember && (
                            <p className="text-xs text-amber-500 mt-1 ml-1 flex items-center">
                                Required for plans
                            </p>
                        )}
                    </div>
                )}

                {/* Voucher Code for Voucher items */}
                {item.type === 'voucher' && (
                    <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1 ml-1 uppercase tracking-wider font-semibold">
                            Voucher Code
                        </div>
                        <Input
                            type="text"
                            placeholder="Enter voucher code..."
                            value={item.voucherCode || ''}
                            onChange={e => setItemVoucherCode(item.cartId, e.target.value)}
                            className="bg-white border-gray-300"
                        />
                    </div>
                )}

                <div className="flex justify-between items-center bg-white rounded p-1 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-mono font-bold text-gray-900 w-6 text-center">
                            {item.quantity}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-900/20 hover:text-red-400"
                        onClick={() => removeItem(item.cartId)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }
)
CartItemRow.displayName = 'CartItemRow'
