import {
    Zap,
    CreditCard,
    Users,
    Calendar,
    Gift,
    Shield,
    Building2,
    Bot,
    CheckSquare,
    BarChart3,
} from 'lucide-react'

const features = [
    {
        icon: Zap,
        title: 'Fast Lane Check-in',
        description: 'QR-Code oder Barcode scannen - fertig. Unter 2 Sekunden pro Gast.',
        gradient: 'from-yellow-500 to-orange-500',
    },
    {
        icon: CreditCard,
        title: 'Point of Sale',
        description: 'Touch-optimierte Kasse mit Produktverwaltung, Rabatten und Split-Zahlungen.',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Users,
        title: 'Mitgliederverwaltung',
        description: 'Abos, 10er-Karten, Kreditpakete - alles zentral verwaltet.',
        gradient: 'from-purple-500 to-pink-500',
    },
    {
        icon: Calendar,
        title: 'Schichtplanung',
        description: 'Verfügbarkeiten, Schichtpläne und automatische Benachrichtigungen.',
        gradient: 'from-green-500 to-emerald-500',
    },
    {
        icon: Gift,
        title: 'Gutschein-System',
        description: 'Verkauf und Einlösung von Geschenkgutscheinen mit Restguthaben-Tracking.',
        gradient: 'from-pink-500 to-rose-500',
    },
    {
        icon: Shield,
        title: 'TSE-Konformität',
        description: 'Deutsche KassenSichV-Compliance mit Fiskaly Cloud TSE Integration.',
        gradient: 'from-slate-500 to-zinc-500',
    },
    {
        icon: Building2,
        title: 'Multi-Tenancy',
        description: 'Mehrere Standorte unter einer Plattform mit Subdomain-Isolation.',
        gradient: 'from-indigo-500 to-violet-500',
    },
    {
        icon: Bot,
        title: 'KI-Assistent',
        description: 'Chalk Bot hilft bei Fragen, Gutschein-Checks und Produktsuche.',
        gradient: 'from-teal-500 to-cyan-500',
    },
    {
        icon: CheckSquare,
        title: 'Checklisten',
        description: 'Schicht-basierte Aufgaben mit Checkboxen, Bewertungen und Freitext.',
        gradient: 'from-amber-500 to-yellow-500',
    },
    {
        icon: BarChart3,
        title: 'Echtzeit-Dashboard',
        description: 'Live-Updates für Besucherzahlen, Umsätze und Team-Status.',
        gradient: 'from-red-500 to-orange-500',
    },
]

export function FeatureSection() {
    return (
        <section id="features" className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800" />

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Alles, was deine Halle braucht
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Von Check-in bis Abrechnung - Chalk deckt alle Bereiche ab.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <div
                                key={index}
                                className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/80 hover:border-slate-600/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Icon */}
                                <div
                                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <Icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Hover glow */}
                                <div
                                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
