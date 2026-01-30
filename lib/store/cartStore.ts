import { create } from 'zustand'
import { Database } from '@/types/database.types'

const generateId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36)

type Product = Database['public']['Tables']['products']['Row']

export interface CartItem extends Product {
    cartId: string
    quantity: number
    assignedMember?: { id: string; name: string } | null
    voucherCode?: string | null
}

export interface CartState {
    items: CartItem[]
    discountType: 'absolute' | 'percentage'
    discountValue: number
    appliedVoucher: { code: string; amount: number } | null
    addItem: (product: Product) => void
    removeItem: (cartId: string) => void
    updateQuantity: (cartId: string, quantity: number) => void
    setItemMember: (cartId: string, member: { id: string; name: string } | null) => void
    setItemVoucherCode: (cartId: string, code: string) => void
    setDiscount: (type: 'absolute' | 'percentage', value: number) => void
    applyVoucher: (code: string, amount: number) => void
    clearVoucher: () => void
    selectedMember: { id: string; name: string } | null
    setMember: (member: { id: string; name: string } | null) => void
    clearCart: () => void
    getTotal: () => number
    getSubtotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    discountType: 'absolute',
    discountValue: 0,
    appliedVoucher: null,
    addItem: product => {
        const items = get().items

        // Plans and Vouchers should always be separate items to allow individual configuration (member assignment or voucher code)
        if (product.type === 'plan' || product.type === 'voucher') {
            set({
                items: [...items, { ...product, quantity: 1, cartId: generateId() }],
            })
            return
        }

        const existingItem = items.find(
            item => item.id === product.id && item.type !== 'plan' && item.type !== 'voucher'
        )

        if (existingItem) {
            set({
                items: items.map(item =>
                    item.cartId === existingItem.cartId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ),
            })
        } else {
            set({ items: [...items, { ...product, quantity: 1, cartId: generateId() }] })
        }
    },
    removeItem: cartId => {
        set({ items: get().items.filter(item => item.cartId !== cartId) })
    },
    updateQuantity: (cartId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(cartId)
            return
        }
        set({
            items: get().items.map(item => (item.cartId === cartId ? { ...item, quantity } : item)),
        })
    },
    setItemMember: (cartId, member) => {
        set({
            items: get().items.map(item =>
                item.cartId === cartId ? { ...item, assignedMember: member } : item
            ),
        })
    },
    setItemVoucherCode: (cartId, code) => {
        set({
            items: get().items.map(item =>
                item.cartId === cartId ? { ...item, voucherCode: code } : item
            ),
        })
    },
    setDiscount: (type, value) => {
        set({ discountType: type, discountValue: value })
    },
    applyVoucher: (code, amount) => {
        set({ appliedVoucher: { code, amount } })
    },
    clearVoucher: () => {
        set({ appliedVoucher: null })
    },
    selectedMember: null,
    setMember: member => set({ selectedMember: member }),
    clearCart: () =>
        set({ items: [], discountValue: 0, selectedMember: null, appliedVoucher: null }),
    getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
    },
    getTotal: () => {
        const subtotal = get().items.reduce((total, item) => total + item.price * item.quantity, 0)
        const { discountType, discountValue, appliedVoucher } = get()

        let total = subtotal

        if (discountValue > 0) {
            if (discountType === 'absolute') {
                total = Math.max(0, total - discountValue)
            } else {
                total = Math.max(0, total * (1 - discountValue / 100))
            }
        }

        if (appliedVoucher) {
            total = Math.max(0, total - appliedVoucher.amount)
        }

        return total
    },
}))
