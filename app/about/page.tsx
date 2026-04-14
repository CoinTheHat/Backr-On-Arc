export default function AboutPage() {
    return (
        <div className="min-h-screen bg-brand-dark text-white pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-secondary to-brand-primary">About Backr</h1>
                    <p className="text-xl text-brand-muted">Empowering creators to own their economy.</p>
                </header>

                <div className="glass-card p-8 rounded-3xl space-y-6 animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-white">Our Mission</h2>
                    <p className="text-gray-300 leading-relaxed text-lg">
                        Backr is built on the belief that creators should have complete ownership of their content and their community.
                        By leveraging Arc Network and Circle Nanopayments, we provide a decentralized platform where revenue flows directly to you,
                        without intermediaries taking a massive cut.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass-card p-8 rounded-3xl animate-fade-in-up delay-100">
                        <h3 className="text-xl font-bold text-brand-secondary mb-3">For Creators</h3>
                        <p className="text-gray-400">
                            Launch your membership, sell exclusive content, and engage with your super-fans directly.
                            Instant payouts, low fees, and complete control.
                        </p>
                    </div>
                    <div className="glass-card p-8 rounded-3xl animate-fade-in-up delay-200">
                        <h3 className="text-xl font-bold text-brand-primary mb-3">For Backrs</h3>
                        <p className="text-gray-400">
                            Support the artists and creators you love. Get access to exclusive perks, behind-the-scenes content,
                            and a closer connection to the creative process.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
