import { getActiveProducts } from '@/app/actions/products'
import { getSettings } from '@/app/actions/settings'
import CartSidebar from '@/components/pos/CartSidebar'
import ProductGrid from '@/components/pos/ProductGrid'
import PosChalkBotDialog from '@/components/pos/PosChalkBotDialog'
import RecentTransactionsDialog from '@/components/pos/RecentTransactionsDialog'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Chalk POS',
    description: 'Point of Sale System',
}

export default async function POSPage() {
    const products = await getActiveProducts()
    const settings = await getSettings()

    return (
        <div className="flex flex-col md:flex-row h-screen w-full bg-background overflow-hidden text-foreground">
            {/* Main Content Area - Product Grid */}
            <main className="flex-grow h-full overflow-hidden flex flex-col">
                <header className="p-4 bg-card border-b border-border flex items-center justify-between shadow-sm">
                    <h1 className="text-2xl font-bold text-foreground">Chalk POS</h1>
                    <div className="flex items-center gap-2">
                        <PosChalkBotDialog />
                        <RecentTransactionsDialog />
                    </div>
                </header>
                <div className="flex-grow overflow-hidden">
                    <ProductGrid products={products} />
                </div>
            </main>

            {/* Sidebar - Shopping Cart */}
            <aside className="w-full md:w-[400px] h-[40vh] md:h-full flex-shrink-0 z-20">
                <CartSidebar settings={settings} />
            </aside>
        </div>
    )
}
