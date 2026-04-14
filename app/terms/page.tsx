export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#05010f] text-white pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
                <div className="glass-card-dark p-8 rounded-3xl space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">1. Introduction</h2>
                        <p>Welcome to Backr. By accessing or using our platform, you agree to be bound by these Terms of Service.</p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">2. Decentralized Content</h2>
                        <p>Backr provides a decentralized platform for content monetization. You acknowledge that content is stored on distributed networks and Backr acts as an interface.</p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">3. User Conduct</h2>
                        <p>You agree not to use the platform for any illegal activities or to harass others.</p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">4. Disclaimer</h2>
                        <p>The service is provided "as is" without warranties of any kind.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
