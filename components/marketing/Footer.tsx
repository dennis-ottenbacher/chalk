import { Mountain } from 'lucide-react'

const footerLinks = {
    product: [
        { label: 'Features', href: '#features' },
        { label: 'Preise', href: '#pricing' },
        { label: 'Demo', href: '#contact' },
        { label: 'Changelog', href: '#changelog' },
    ],
    company: [
        { label: 'Über uns', href: '#about' },
        { label: 'Blog', href: '#blog' },
        { label: 'Karriere', href: '#careers' },
        { label: 'Kontakt', href: '#contact' },
    ],
    legal: [
        { label: 'Impressum', href: '/impressum' },
        { label: 'Datenschutz', href: '/datenschutz' },
        { label: 'AGB', href: '/agb' },
    ],
}

export function Footer() {
    return (
        <footer className="bg-slate-900 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                                <Mountain className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">Chalk</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed mb-6 max-w-sm">
                            Das moderne POS-System für Boulder-Gyms. Entwickelt von Kletterern für
                            Kletterer.
                        </p>
                        <div className="flex gap-4">
                            {/* Social links placeholder */}
                            {['Twitter', 'LinkedIn', 'GitHub'].map(social => (
                                <a
                                    key={social}
                                    href="#"
                                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                    aria-label={social}
                                >
                                    <span className="text-xs font-medium">{social.charAt(0)}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Produkt</h4>
                        <ul className="space-y-3">
                            {footerLinks.product.map(link => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Unternehmen</h4>
                        <ul className="space-y-3">
                            {footerLinks.company.map(link => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Rechtliches</h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map(link => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} Chalk POS. Alle Rechte vorbehalten.
                    </p>
                    <p className="text-slate-500 text-sm">Made with ❤️ in Deutschland</p>
                </div>
            </div>
        </footer>
    )
}
