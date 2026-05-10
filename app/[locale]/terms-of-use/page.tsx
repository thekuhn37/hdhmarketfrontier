import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use | HDH Market Frontier',
}

export default function TermsOfUsePage() {
  return (
    <div className="bg-white py-16">
      <div className="article-width">
        <h1 className="text-4xl font-bold text-[#0F172A] mb-4 tracking-tight">Terms of Use</h1>
        <p className="text-[#6B7280] text-sm mb-12">Last updated: January 2025</p>

        <div className="article-body space-y-10">
          <section>
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
              <p className="text-amber-800 font-medium">Important Notice</p>
              <p className="text-amber-700 text-sm mt-1">The information on this website is provided for general informational and educational purposes only and does not constitute investment, legal, tax, or professional advice. Nothing on this site should be interpreted as a recommendation to buy, sell, or hold any financial instrument.</p>
            </div>
          </section>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using HDH Market Frontier (hdhmarketfrontier.com), you accept and agree to be bound by these Terms of Use. If you do not agree to these terms, please discontinue use of this website.</p>
          </section>

          <section>
            <h2>2. Informational Purposes Only</h2>
            <p>All content published on this website — including articles, analyses, opinions, and data — is for informational and educational purposes only. It does not constitute:</p>
            <ul>
              <li>Investment advice or recommendations</li>
              <li>Legal, tax, or professional advice</li>
              <li>An offer or solicitation to buy or sell any security</li>
            </ul>
            <p>Always consult qualified professionals before making investment or financial decisions.</p>
          </section>

          <section>
            <h2>3. Intellectual Property</h2>
            <p>All content on this website, including text, graphics, logos, and data, is the intellectual property of Harry D. Hwang or properly licensed third parties. You may share content with attribution, but may not reproduce or republish it for commercial purposes without written permission.</p>
          </section>

          <section>
            <h2>4. User Comments</h2>
            <p>By submitting comments, you grant HDH Market Frontier a non-exclusive license to display your comment. You agree not to post:</p>
            <ul>
              <li>Defamatory, offensive, or illegal content</li>
              <li>Spam or promotional content</li>
              <li>Personal information of others without consent</li>
              <li>Content that infringes intellectual property rights</li>
            </ul>
            <p>We reserve the right to remove comments that violate these guidelines.</p>
          </section>

          <section>
            <h2>5. External Links</h2>
            <p>This website may contain links to external sites. We are not responsible for the content or privacy practices of those sites. External links are provided for convenience and do not constitute endorsement.</p>
          </section>

          <section>
            <h2>6. Accuracy of Information</h2>
            <p>While we strive to provide accurate and up-to-date information, we make no guarantees regarding the completeness, accuracy, or timeliness of content. Financial markets and regulatory environments change frequently; always verify information independently.</p>
          </section>

          <section>
            <h2>7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, HDH Market Frontier and Harry D. Hwang shall not be liable for any indirect, incidental, or consequential damages arising from your use of or reliance on this website or its content.</p>
          </section>

          <section>
            <h2>8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2>9. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:contact@hdhmarketfrontier.com">contact@hdhmarketfrontier.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
