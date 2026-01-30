import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPublicLandingPage } from '@/app/actions/landing-pages'

export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const headersList = await headers()
    const organizationId = headersList.get('x-organization-id')

    if (!organizationId) {
        notFound()
    }

    const landingPage = await getPublicLandingPage(organizationId, slug)

    if (!landingPage) {
        notFound()
    }

    return (
        <div
            className="min-h-screen"
            dangerouslySetInnerHTML={{ __html: landingPage.html_content }}
        />
    )
}
