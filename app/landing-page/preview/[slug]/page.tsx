import { redirect } from 'next/navigation'
import { getPreviewLandingPage } from '@/app/actions/landing-pages'

export default async function PreviewLandingPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const result = await getPreviewLandingPage(slug)

    if (result.error) {
        // If not logged in, redirect to login
        if (result.error === 'Nicht angemeldet') {
            redirect('/login')
        }
        // Show error for other cases (no permission, not found)
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Zugriff verweigert</h1>
                    <p className="mt-2 text-gray-600">{result.error}</p>
                </div>
            </div>
        )
    }

    if (!result.landingPage) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Preview Banner */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-2 text-sm font-medium">
                ⚠️ Vorschau-Modus – Diese Seite ist{' '}
                {result.landingPage.is_published ? 'veröffentlicht' : 'nicht veröffentlicht'}
            </div>
            <div
                className="min-h-screen pt-10"
                dangerouslySetInnerHTML={{ __html: result.landingPage.html_content }}
            />
        </>
    )
}
