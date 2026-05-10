import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | HDH Market Frontier',
  description: 'Privacy Policy for HDH Market Frontier',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white py-16">
      <div className="article-width">
        <h1 className="text-4xl font-bold text-[#0F172A] mb-4 tracking-tight">Privacy Policy</h1>
        <p className="text-[#6B7280] text-sm mb-12">Last updated: January 2025</p>

        <div className="article-body space-y-10">
          <section>
            <h2>1. Data Controller</h2>
            <p>HDH Market Frontier is operated by Harry D. Hwang. For privacy-related inquiries, please contact: <a href="mailto:contact@hdhmarketfrontier.com">contact@hdhmarketfrontier.com</a></p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>We collect information you provide directly to us:</p>
            <ul>
              <li><strong>Contact form data:</strong> Name, email address, organization, and message content when you submit our contact form.</li>
              <li><strong>Account data:</strong> Email address, display name, and password when you create an account.</li>
              <li><strong>Comment data:</strong> Content of comments you submit on articles.</li>
              <li><strong>Usage data:</strong> Pages visited, time on page, referrer URL, and browser information for analytics purposes (only with your consent).</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul>
              <li>Respond to your inquiries and contact form submissions</li>
              <li>Manage your account and authenticate your identity</li>
              <li>Improve website functionality and user experience</li>
              <li>Analyze site traffic and content performance (analytics cookies only with consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Retention</h2>
            <p>We retain your personal data only as long as necessary for the purposes described in this policy. Contact form submissions are retained for up to 2 years. Account data is retained until you request deletion. Comment data associated with published articles is retained indefinitely unless you request removal.</p>
          </section>

          <section>
            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing</li>
            </ul>
            <p>To exercise these rights, please contact us at <a href="mailto:contact@hdhmarketfrontier.com">contact@hdhmarketfrontier.com</a>.</p>
          </section>

          <section>
            <h2>6. Cookies</h2>
            <p>We use cookies to improve your experience. Essential cookies are required for the site to function. Analytics and functional cookies are only used with your explicit consent. For more details, see our <a href="/cookie-policy">Cookie Policy</a>.</p>
          </section>

          <section>
            <h2>7. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li><strong>Supabase:</strong> Database, authentication, and storage provider</li>
              <li><strong>Google OAuth:</strong> Optional login via Google account</li>
              <li><strong>Resend:</strong> Email delivery service</li>
            </ul>
          </section>

          <section>
            <h2>8. Contact</h2>
            <p>For any privacy-related questions or concerns, please contact us at <a href="mailto:contact@hdhmarketfrontier.com">contact@hdhmarketfrontier.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
