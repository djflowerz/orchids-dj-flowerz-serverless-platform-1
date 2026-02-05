export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-4xl mx-auto px-4 py-20">
                <h1 className="font-display text-5xl md:text-7xl mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    Privacy Policy
                </h1>
                <p className="text-white/60 mb-12">Last Updated: February 2026</p>

                <div className="space-y-12 text-white/80">
                    <section>
                        <h2 className="font-display text-3xl mb-4 text-purple-400">1. Information We Collect</h2>
                        <p className="leading-relaxed mb-4">
                            We collect information you provide directly to us, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Name and email address</li>
                            <li>Payment information (processed securely through Paystack)</li>
                            <li>Subscription preferences and tier selections</li>
                            <li>Content downloads and listening history</li>
                            <li>Booking and session information</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-display text-3xl mb-4 text-purple-400">2. How We Use Your Information</h2>
                        <p className="leading-relaxed mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Process your transactions and manage your subscriptions</li>
                            <li>Provide access to exclusive content and music pool</li>
                            <li>Send you updates about new releases and features</li>
                            <li>Manage Telegram channel access for subscribers</li>
                            <li>Improve our services and user experience</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-display text-3xl mb-4 text-purple-400">3. Data Security</h2>
                        <p className="leading-relaxed">
                            We implement industry-standard security measures to protect your personal information.
                            All payment processing is handled securely through Paystack, and we never store your
                            complete payment card details on our servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-display text-3xl mb-4 text-purple-400">4. Third-Party Services</h2>
                        <p className="leading-relaxed mb-4">
                            We use the following third-party services:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Paystack:</strong> Payment processing</li>
                            <li><strong>Firebase:</strong> Database and authentication</li>
                            <li><strong>Clerk:</strong> User authentication and management</li>
                            <li><strong>Telegram:</strong> Exclusive content delivery</li>
                            <li><strong>Cloudflare:</strong> Hosting and CDN services</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-display text-3xl mb-4 text-purple-400">5. Your Rights</h2>
                        <p className="leading-relaxed mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Access your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Opt-out of marketing communications</li>
                            <li>Export your data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-display text-3xl mb-4 text-purple-400">6. Cookies</h2>
                        <p className="leading-relaxed">
                            We use cookies and similar tracking technologies to track activity on our service and
                            hold certain information. You can instruct your browser to refuse all cookies or to
                            indicate when a cookie is being sent.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-display text-3xl mb-4 text-purple-400">7. Contact Us</h2>
                        <p className="leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at{' '}
                            <a href="mailto:ianmuriithiflowerz@gmail.com" className="text-purple-400 hover:text-purple-300">
                                ianmuriithiflowerz@gmail.com
                            </a>
                        </p>
                    </section>
                </div>

                <div className="mt-16 p-6 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                    <h3 className="font-display text-2xl mb-4 text-purple-400">Terms of Service</h3>
                    <p className="text-white/70 leading-relaxed">
                        By using DJ Flowerz services, you agree to our terms of service. All content is protected
                        by copyright and is for personal use only. Redistribution of exclusive content is strictly
                        prohibited and may result in account termination.
                    </p>
                </div>
            </div>
        </div>
    )
}
