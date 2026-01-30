'use client'

import { useState } from 'react'
import { Zap, CreditCard, Shield, Bot } from 'lucide-react'

const detailFeatures = [
    {
        id: 'checkin',
        icon: Zap,
        title: 'Fast Lane Check-in',
        subtitle: 'Maximaler Durchsatz, minimale Wartezeit',
        description:
            'Der Fast Lane Check-in nutzt Hardware-Scanner oder Smartphone-Kameras für blitzschnelles Einchecken. Mitglieder zeigen ihren QR-Code, das System validiert in Echtzeit und zeigt sofort den Status an.',
        highlights: [
            'QR-Code oder Barcode Scanning',
            'Hardware-Scanner-Unterstützung',
            'Automatische Abo-Validierung',
            '10er-Karten Guthaben-Tracking',
            'Visuelles Feedback (Grün/Rot)',
            'Besucherzählung in Echtzeit',
        ],
        gradient: 'from-yellow-500 to-orange-500',
    },
    {
        id: 'pos',
        icon: CreditCard,
        title: 'Point of Sale',
        subtitle: 'Die Kasse, die mitdenkt',
        description:
            'Touch-optimiert für Tablets und Counter-Displays. Produkte per Tap hinzufügen, Rabatte anwenden, Split-Zahlungen durchführen und Transaktionen mit TSE signieren - alles in einem Flow.',
        highlights: [
            'Touch-optimiertes Interface',
            'Produkt-Schnellsuche',
            'Rabatte (Prozent & Absolut)',
            'Bar, Karte & Gutschein-Zahlung',
            'Cart Parking (Bestellungen parken)',
            'Transaktionshistorie mit Storno',
        ],
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'tse',
        icon: Shield,
        title: 'TSE-Konformität',
        subtitle: 'KassenSichV-Ready aus der Box',
        description:
            'Chalk integriert nahtlos mit Fiskaly Cloud TSE für die deutsche Fiskal-Compliance. Jede Transaktion wird kryptografisch signiert und ist audit-sicher gespeichert.',
        highlights: [
            'Fiskaly Cloud TSE Integration',
            'Automatische Transaktions-Signatur',
            'DSFinV-K Export für Prüfungen',
            'QR-Code auf Belegen',
            'Graceful Degradation bei Ausfällen',
            'Multi-Mandanten TSE-Support',
        ],
        gradient: 'from-slate-500 to-zinc-500',
    },
    {
        id: 'ai',
        icon: Bot,
        title: 'Chalk Bot',
        subtitle: 'Dein KI-Assistent an der Theke',
        description:
            'Der Chalk Bot versteht natürliche Sprache und hilft bei alltäglichen Aufgaben: Gutschein-Status prüfen, Produkte finden, Mitglieder nachschlagen - alles per Gespräch.',
        highlights: [
            'Natürliche Sprachverarbeitung',
            'Gutschein-Validierung per Chat',
            'Produkt- und Mitglieder-Suche',
            'Kontextbezogene Hilfe',
            'Schnellerer Workflow für Staff',
            'Erweiterbar mit neuen Skills',
        ],
        gradient: 'from-teal-500 to-cyan-500',
    },
]

export function FeatureDetails() {
    const [activeFeature, setActiveFeature] = useState(detailFeatures[0])

    return (
        <section className="py-24 relative bg-slate-800">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Im Detail</h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Entdecke die Kernfunktionen von Chalk.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {detailFeatures.map(feature => {
                        const Icon = feature.icon
                        const isActive = activeFeature.id === feature.id
                        return (
                            <button
                                key={feature.id}
                                onClick={() => setActiveFeature(feature)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                                    isActive
                                        ? `bg-gradient-to-r ${feature.gradient} text-white shadow-lg`
                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {feature.title}
                            </button>
                        )
                    })}
                </div>

                {/* Feature Detail Card */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 md:p-12">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left: Description */}
                        <div>
                            <div
                                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${activeFeature.gradient} mb-6`}
                            >
                                <activeFeature.icon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-3">
                                {activeFeature.title}
                            </h3>
                            <p className="text-lg text-emerald-400 font-medium mb-6">
                                {activeFeature.subtitle}
                            </p>
                            <p className="text-slate-300 leading-relaxed mb-8">
                                {activeFeature.description}
                            </p>
                            <a
                                href="#contact"
                                className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${activeFeature.gradient} text-white font-semibold rounded-xl hover:scale-105 transition-transform duration-300`}
                            >
                                Mehr erfahren
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                </svg>
                            </a>
                        </div>

                        {/* Right: Highlights */}
                        <div className="space-y-4">
                            {activeFeature.highlights.map((highlight, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/30"
                                >
                                    <div
                                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${activeFeature.gradient} flex items-center justify-center flex-shrink-0`}
                                    >
                                        <svg
                                            className="w-5 h-5 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                    <span className="text-white font-medium">{highlight}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
