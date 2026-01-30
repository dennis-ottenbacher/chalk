'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Save, ShoppingBag, Trash2, Play, Loader2 } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { saveCart, getSavedCarts, deleteSavedCart, SavedCart } from '@/app/actions/cart'

export default function SavedCartsManager() {
    const items = useCartStore(state => state.items)
    const clearCart = useCartStore(state => state.clearCart)
    const addItem = useCartStore(state => state.addItem)

    const [savedCarts, setSavedCarts] = useState<SavedCart[]>([])
    const [isSaveOpen, setIsSaveOpen] = useState(false)
    const [isListOpen, setIsListOpen] = useState(false)
    const [cartName, setCartName] = useState('')
    const [loading, setLoading] = useState(false)
    const [isPending, startTransition] = useTransition()

    const fetchSavedCarts = async () => {
        try {
            const data = await getSavedCarts()
            setSavedCarts(data)
        } catch (error) {
            console.error('Failed to fetch saved carts', error)
        }
    }

    // Pre-fetch on mount
    useEffect(() => {
        fetchSavedCarts()
    }, [])

    const handleSave = async () => {
        if (!cartName.trim()) return
        setLoading(true)
        try {
            await saveCart(cartName, items)
            clearCart()
            setIsSaveOpen(false)
            setCartName('')
            fetchSavedCarts()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async (cart: SavedCart) => {
        startTransition(async () => {
            try {
                // Restore items to cart
                // Clear current cart first? Or append? usually restore means "this is the cart now".
                // I'll clear first to be safe and avoid mixing.
                clearCart()

                // Add items back
                // We need to loop because addItem takes single product and handles quantity internally?
                // Wait, addItem logic: checks existing and increments.
                // Our CartItem has quantity.
                // If we use addItem, we might need to call it quantity times OR update store to accept bulk add / set.
                // Looking at internal store:
                // addItem: (product) => ... checks if existing ... set quantity + 1.
                // This is inefficient for restoring quantity=10.
                // But CartItem extends Product.
                // I should probably manually "set items" if store allowed it, but it doesn't expose `setItems`.
                // It exposes `addItem`.
                // I will modify the store or just loop efficiently?
                // Looping 50 times for 50 items is bad.
                // I'll check store again.
                // It just uses `set`. I can maybe add `restoreCart` to store later.
                // For now, I'll loop `addItem` but `addItem` implementation in store finds by id every time.
                // For MVP it's fine.

                cart.items.forEach(product => {
                    // addItem increments by 1. So we call it product.quantity times
                    // faster way: just call it once then updateQuantity
                    addItem(product)
                    useCartStore.getState().updateQuantity(product.id, product.quantity)
                })

                // Remove from saved
                await deleteSavedCart(cart.id)

                setIsListOpen(false)
                fetchSavedCarts()
            } catch (error) {
                console.error('Failed to restore', error)
            }
        })
    }

    const handleDelete = async (id: string) => {
        setLoading(true)
        try {
            await deleteSavedCart(id)
            fetchSavedCarts()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex gap-2">
            {/* Save Button */}
            <AlertDialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                <Button
                    variant="outline"
                    className="border-gray-200 hover:bg-gray-100 text-gray-700 shadow-sm"
                    disabled={items.length === 0}
                    onClick={() => setIsSaveOpen(true)}
                >
                    <Save className="h-4 w-4 mr-2" />
                    Park
                </Button>
                <AlertDialogContent className="bg-white border-gray-200 text-gray-900 shadow-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Park Current Cart</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500">
                            Give this cart a name to retrieve it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Member Name / Table Number"
                            className="bg-white border-gray-200 text-gray-900"
                            value={cartName}
                            onChange={e => setCartName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSave()
                            }}
                            autoFocus
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-200">
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleSave}
                            disabled={!cartName.trim() || loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Cart'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Saved Button */}
            <AlertDialog open={isListOpen} onOpenChange={setIsListOpen}>
                <Button
                    variant={savedCarts.length > 0 ? 'outline' : 'ghost'}
                    className={`${savedCarts.length > 0 ? 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm' : 'text-gray-500'}`}
                    onClick={() => {
                        fetchSavedCarts()
                        setIsListOpen(true)
                    }}
                >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Restore
                    {savedCarts.length > 0 && (
                        <Badge
                            variant="destructive"
                            className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                        >
                            {savedCarts.length}
                        </Badge>
                    )}
                </Button>
                <AlertDialogContent
                    size="2xl"
                    className="bg-white border-gray-200 text-gray-900 max-h-[85vh] flex flex-col shadow-xl"
                >
                    <AlertDialogHeader>
                        <AlertDialogTitle>Saved Carts</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500">
                            Select a cart to restore and checkout.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="flex-1 overflow-y-auto py-4 space-y-3">
                        {savedCarts.length === 0 && (
                            <div className="text-center text-gray-500 py-10">No saved carts.</div>
                        )}
                        {savedCarts.map(cart => (
                            <div
                                key={cart.id}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex justify-between items-center gap-4"
                            >
                                <div className="space-y-1">
                                    <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                        {cart.name}
                                        <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                            {new Intl.DateTimeFormat('de-DE', {
                                                timeStyle: 'short',
                                            }).format(new Date(cart.created_at))}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {cart.items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                                        items • €
                                        {cart.items
                                            .reduce(
                                                (acc, item) => acc + item.price * item.quantity,
                                                0
                                            )
                                            .toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500 line-clamp-1">
                                        {cart.items.map(i => i.name).join(', ')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => handleRestore(cart)}
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        ) : (
                                            <Play className="h-3 w-3 mr-1" />
                                        )}
                                        Restore
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(cart.id)}
                                        disabled={isPending || loading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-200">
                            Close
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
