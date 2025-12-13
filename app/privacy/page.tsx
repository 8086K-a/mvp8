import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - MornHub',
  description: 'Privacy policy for MornHub application',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
        <div className="prose prose-invert max-w-none">
          <p className="text-slate-300 mb-6">
            Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-slate-300 mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              use our services, or contact us for support.
              </p>
            </section>

            <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-slate-300 mb-4">
              We use the information we collect to provide and maintain our services, 
              process your transactions, and improve our services.
              </p>
            </section>

            <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Contact Us</h2>
            <p className="text-slate-300 mb-4">
              If you have any questions about this privacy policy, please contact us at:
              </p>
            <p className="text-slate-300">
              Email: privacy@mornhub.help<br />
              Website: https://mornhub.help
              </p>
            </section>
        </div>
      </div>
    </div>
  )
} 