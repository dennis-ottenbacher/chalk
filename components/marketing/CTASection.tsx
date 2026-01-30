import { ArrowRight, Check } from 'lucide-react'

export function CTASection() {
    return (
        <section id="contact" className="py-24 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:32px_32px]" />

            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                    Bereit für modernes
                    <br />
                    Gym-Management?
                </h2>
                <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12">
                    Kontaktiere uns für eine persönliche Demo und erfahre, wie Chalk deinen Alltag
                    vereinfachen kann.
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap justify-center gap-6 mb-12">
                    {[
                        'Kostenlose Demo',
                        'Keine Kreditkarte nötig',
                        '30 Tage testen',
                        'Persönlicher Support',
                    ].map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-white/90">
                            <Check className="w-5 h-5 text-white" />
                            <span className="font-medium">{benefit}</span>
                        </div>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href="mailto:info@chalk-pos.de?subject=Demo%20Anfrage"
                        className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-600 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        Demo anfragen
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </a>
                    <a
                        href="#features"
                        className="inline-flex items-center justify-center px-8 py-4 bg-white/10 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 hover:border-white/50 transition-all duration-300"
                    >
                        Features ansehen
                    </a>
                </div>
            </div>
        </section>
    )
}
