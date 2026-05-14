import { ShieldCheck } from 'lucide-react'

export default function ComplianceNotice() {
  return (
    <div className="flex gap-3 px-4 py-3 rounded-xl border border-[#38BDF8]/30 bg-[#F0F9FF] dark:bg-[#38BDF8]/5 dark:border-[#38BDF8]/20">
      <ShieldCheck size={16} className="text-[#38BDF8] flex-shrink-0 mt-0.5" />
      <p className="text-xs text-[#0369A1] dark:text-[#7DD3FC] leading-relaxed">
        This tool does not automate login, bypass access controls, or run continuous scraping.
        Use it only for personal research and permitted content. For login-required sources
        (LinkedIn, FISD), paste the job text manually or upload a saved copy.
        Search runs only when manually triggered by the admin.
      </p>
    </div>
  )
}
