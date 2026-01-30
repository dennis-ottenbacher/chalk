import { redirect } from 'next/navigation'
import { isMarketingSite } from '@/lib/get-organization'
import { Hero } from '@/components/marketing/Hero'
import { FeatureSection } from '@/components/marketing/FeatureSection'
import { FeatureDetails } from '@/components/marketing/FeatureDetails'
import { CTASection } from '@/components/marketing/CTASection'
import { Footer } from '@/components/marketing/Footer'

export default async function Home() {
    const isMarketing = await isMarketingSite()

    // For app users (non-www), redirect to login
    if (!isMarketing) {
        redirect('/login')
    }

    // For www subdomain, show the marketing landing page
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            <Hero />
            <FeatureSection />
            <FeatureDetails />
            <CTASection />
            <Footer />
        </div>
    )
}
