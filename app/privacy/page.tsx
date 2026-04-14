export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#05010f] text-white pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
                <div className="glass-card-dark p-8 rounded-3xl space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">1. Data Collection</h2>
                        <p>We respect your privacy. As a decentralized platform, we minimize data collection. We collect only what is necessary to provide the service.</p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">2. Wallet Information</h2>
                        <p>When you sign in, we see your public address. We do not have access to your private keys.</p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">3. Cookies</h2>
                        <p>We use local storage just to enhance your user experience (e.g., remembering your theme preference).</p>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold text-white mb-2">4. Changes</h2>
                        <p>We may update this policy from time to time. Continued use signifies acceptance.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
