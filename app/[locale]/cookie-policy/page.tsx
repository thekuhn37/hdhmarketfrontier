import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | HDH Market Frontier',
}

export default function CookiePolicyPage() {
  return (
    <div className="bg-white dark:bg-[#0B1120] py-16">
      <div className="article-width">
        <h1 className="text-4xl font-bold text-[#0F172A] dark:text-white mb-4 tracking-tight">Cookie Policy</h1>
        <p className="text-[#6B7280] dark:text-slate-400 text-sm mb-12">Last updated: January 2025</p>

        <div className="article-body space-y-10">
          <section>
            <h2>1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and understand how you interact with the site.</p>
          </section>

          <section>
            <h2>2. Types of Cookies We Use</h2>

            <h3>Essential Cookies</h3>
            <p>These cookies are required for the website to function properly. They cannot be disabled. Examples:</p>
            <ul>
              <li>Session authentication tokens (Supabase Auth)</li>
              <li>Cookie consent preferences</li>
              <li>CSRF protection tokens</li>
            </ul>

            <h3>Analytics Cookies</h3>
            <p>Used only with your consent. These help us understand how visitors use the site:</p>
            <ul>
              <li>Page view tracking</li>
              <li>Session identifiers (anonymous)</li>
              <li>Traffic source tracking</li>
            </ul>

            <h3>Functional Cookies</h3>
            <p>Enhance your experience with optional features:</p>
            <ul>
              <li>Language preference</li>
              <li>User interface preferences</li>
            </ul>
          </section>

          <section>
            <h2>3. Cookie Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-[#E5E7EB] rounded-xl overflow-hidden">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th className="text-left p-3 border-b border-[#E5E7EB] font-semibold text-[#0F172A]">Name</th>
                    <th className="text-left p-3 border-b border-[#E5E7EB] font-semibold text-[#0F172A]">Purpose</th>
                    <th className="text-left p-3 border-b border-[#E5E7EB] font-semibold text-[#0F172A]">Duration</th>
                    <th className="text-left p-3 border-b border-[#E5E7EB] font-semibold text-[#0F172A]">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'hdh_cookie_consent', purpose: 'Stores your cookie consent preferences', duration: '1 year', type: 'Essential' },
                    { name: 'sb-auth-token', purpose: 'Authentication session token', duration: 'Session', type: 'Essential' },
                    { name: 'hdh_session', purpose: 'Anonymous session identifier for analytics', duration: '30 days', type: 'Analytics' },
                    { name: 'NEXT_LOCALE', purpose: 'Stores your language preference', duration: '1 year', type: 'Functional' },
                  ].map((row, i) => (
                    <tr key={row.name} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                      <td className="p-3 font-mono text-xs">{row.name}</td>
                      <td className="p-3 text-[#4B5563]">{row.purpose}</td>
                      <td className="p-3 text-[#4B5563]">{row.duration}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs bg-[#F8FAFC] border border-[#E5E7EB]">{row.type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>4. Managing Cookies</h2>
            <p>You can manage cookie preferences at any time using the cookie consent banner. You can also control cookies through your browser settings. Note that disabling essential cookies may affect site functionality.</p>
            <p>Most browsers allow you to view, delete, and block cookies. For more information, visit your browser's help pages.</p>
          </section>

          <section>
            <h2>5. Contact</h2>
            <p>For questions about our use of cookies, contact us at <a href="mailto:contact@hdhmarketfrontier.com">contact@hdhmarketfrontier.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
