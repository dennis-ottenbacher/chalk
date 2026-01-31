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
        <div className="flex flex-col h-full bg-card border-l border-border w-full md:w-96 shadow-xl">
            <div className="p-4 border-b border-border space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground">Current Order</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic">
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

            <div className="p-4 bg-card border-t border-border space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Discount
                    </label>
                    <div className="flex gap-2">
                        <div className="flex bg-muted rounded-md p-1 border border-border shrink-0">
                            {/* POS: Large touch targets */}
                            <Button
                                variant={discountType === 'absolute' ? 'secondary' : 'ghost'}
                                className={`h-10 w-12 text-sm font-bold ${discountType === 'absolute' ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                                onClick={() => setDiscount('absolute', discountValue)}
                            >
                                €
                            </Button>
                            <Button
                                variant={discountType === 'percentage' ? 'secondary' : 'ghost'}
                                className={`h-10 w-12 text-sm font-bold ${discountType === 'percentage' ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
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
                            className="h-12 text-base font-bold text-center bg-muted border-border text-foreground focus:border-primary placeholder:text-muted-foreground"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-border">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    {generalDiscountAmount > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
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
                        <div className="flex justify-between text-sm text-success font-medium">
                            <div className="flex items-center gap-1">
                                <span>Voucher ({appliedVoucher.code})</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 hover:bg-success/10 rounded-full"
                                    onClick={clearVoucher}
                                    title="Remove Voucher"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <span>-€{voucherDiscountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-foreground pt-1">
                        <span>Total</span>
                        <span className="text-success">€{total.toFixed(2)}</span>
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
            <div className="flex flex-col bg-muted p-3 rounded-md border border-border">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-foreground line-clamp-1">{item.name}</span>
                    <span className="font-bold text-success shrink-0 ml-2">
                        €{(item.price * item.quantity).toFixed(2)}
                    </span>
                </div>

                {/* Member Search for Plan items */}
                {item.type === 'plan' && (
                    <div className="mb-3">
                        <div className="text-xs text-muted-foreground mb-1 ml-1 uppercase tracking-wider font-semibold">
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
                            <p className="text-xs text-warning mt-1 ml-1 flex items-center">
                                Required for plans
                            </p>
                        )}
                    </div>
                )}

                {/* Voucher Code for Voucher items */}
                {item.type === 'voucher' && (
                    <div className="mb-3">
                        <div className="text-xs text-muted-foreground mb-1 ml-1 uppercase tracking-wider font-semibold">
                            Voucher Code
                        </div>
                        <Input
                            type="text"
                            placeholder="Enter voucher code..."
                            value={item.voucherCode || ''}
                            onChange={e => setItemVoucherCode(item.cartId, e.target.value)}
                            className="bg-card border-border"
                        />
                    </div>
                )}

                {/* POS: Large touch targets for quantity controls */}
                <div className="flex justify-between items-center bg-card rounded p-1 border border-border">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-mono font-bold text-foreground w-6 text-center">
                            {item.quantity}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
