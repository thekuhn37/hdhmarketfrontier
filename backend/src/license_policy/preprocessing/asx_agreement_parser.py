"""ASX MarketSource Agreement (General Terms & Conditions) parser."""

from __future__ import annotations

from ..models.enums import (
    AgreementType,
    ObligationType,
    TerminationTrigger,
    UseClassification,
    UseContext,
)
from ..models.schema import (
    ComplianceObligation,
    DisputeResolution,
    ExchangePolicy,
    ForceProvision,
    LiabilityProvision,
    LicenseScope,
    RedistributionRestriction,
    Section,
    SubscriberAgreementRequirement,
    SuspensionProvision,
    TerminationProvision,
    UsePolicy,
    WindDownProvision,
)
from .pdf_extract import ExtractedDocument


def parse_asx_agreement(doc: ExtractedDocument) -> ExchangePolicy:
    """Parse ASX MarketSource Agreement (General T&Cs) into ExchangePolicy."""
    definitions = {d.term: d.body for d in doc.definitions}

    license_scope = LicenseScope(
        grant_type="non-transferable, non-exclusive licence",
        territory=None,
        sublicensable=False,
        transferable=False,
        exclusive=False,
        description=(
            "Licence to store/process Information, display Real Time in Closed User Groups, "
            "display Delayed/EOD in Closed/Open User Groups, distribute as Datafeed to "
            "Subscriber Firms for internal use, and Non-Display Use (clause 6.1)."
        ),
    )

    use_policies = [
        UsePolicy(
            classification=UseClassification.permitted,
            description="Store and process Information in Your System.",
            source_section="6.1(a)",
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Display Real Time Information on a Device to End Users in Closed User Groups.",
            conditions=["Must comply with Agreement terms", "Must pay applicable Fees"],
            source_section="6.1(b)(i)",
            use_context=UseContext.display,
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Display Delayed and EOD Information on a Device to Closed or Open User Groups.",
            source_section="6.1(b)(ii)",
            use_context=UseContext.display,
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Distribute Information as part of a Datafeed to Subscriber Firms for their internal use only.",
            source_section="6.1(b)(iii)",
            use_context=UseContext.datafeed,
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Use and distribute Real Time, Delayed or EOD Information for Non-Display Use purposes.",
            source_section="6.1(b)(iv)",
            use_context=UseContext.non_display,
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description=(
                "Provide Information to Sub-vendors for distribution to their Subscriber Firms and End Users, "
                "with prior written authorisation from ASX."
            ),
            conditions=[
                "Sub-vendor must have entered appropriate MarketSource distribution agreement with ASX",
                "If released without authorisation, licensee liable for Sub-vendor's Fees",
            ],
            source_section="6.2",
            use_context=UseContext.redistribution,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="Use Information for creating a New Original Work.",
            conditions=[
                "Requires prior written consent from ASX (may be withheld in absolute discretion)",
                "ASX determines whether processed Information constitutes a New Original Work",
                "If approved, ASX acknowledges licensee owns IP in the New Original Work",
                "Order Form updated per clause 6.4",
            ],
            source_section="6.7",
            use_context=UseContext.new_original_work,
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description=(
                "End Users may publish ad-hoc limited extracts of static Information in written or "
                "oral communications with clients in connection with ordinary financial services business."
            ),
            conditions=[
                "Must not constitute regular or systematic distribution",
                "Must not involve Real Time or continuously updating Information",
                "Must be attributed to ASX",
                "ASX reserves right to determine what constitutes limited extracts",
            ],
            source_section="6.8",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description=(
                "Use Information to establish, maintain or provide the ability to trade Financial Products "
                "or a financial market for trading, unless specifically authorised by law."
            ),
            source_section="6.6",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Use Information other than as permitted by the terms of this Agreement.",
            source_section="6.9",
        ),
    ]

    subscriber_agreement_requirements = [
        SubscriberAgreementRequirement(
            description=(
                "Before providing Information to any Subscriber Firm, must enter into a Subscriber Agreement "
                "containing terms materially consistent with obligations under the MarketSource Agreement (clause 7.1-7.4)."
            ),
            mandatory_terms=[
                "Only use Information solely for own internal business purposes",
                "Not transfer or publish to third parties except as permitted",
                "Recognise IP Rights of ASX and ASX's Suppliers",
                "Not allow any person other than an End User to access Information",
                "Ensure each End User has unique user ID/password as part of approved A&E System; no sharing",
                "Not use Information for illegal purpose or purpose not permitted under Agreement",
                "Maintain records and provide information for record keeping, reporting and payment obligations including monthly device/user counts",
                "Allow ASX or authorised representative to remotely audit and/or enter premises to audit systems, records and usage",
                "Obtain and provide consents for ASX to review personal information for compliance verification",
                "Keep confidential all ASX Confidential Information; no third-party disclosure without prior written consent",
            ],
        ),
    ]

    compliance_obligations = [
        ComplianceObligation(
            type=ObligationType.record_keeping,
            description="Retain up-to-date books and records to enable Fees and other sums to be ascertained.",
            duration="Period specified in the Guide",
            details=[
                "Must retain records as specified in the Guide from time to time",
                "Where Datafeed provided to Subscriber Firm, must require Subscriber Firms to retain A&E records",
                "Subscriber Firms must report usage preferably monthly, at intervals not exceeding 3 calendar months",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.reporting,
            description="Monthly remittance report concerning use and distribution of Information.",
            details=[
                "Submit within timeframe and format specified in the Guide",
                "Must cover all use and distribution of Information",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.audit,
            description="ASX may send personnel to verify compliance with the Agreement.",
            details=[
                "At least 30 days notice (less if reasonable grounds for compliance suspicion)",
                "Remote and/or in-person inspection during normal business hours",
                "Covers: services, A&E system, devices, systems, applications, books and records",
                "Underpayment >5%: customer bears reasonable audit costs",
                "Underpayment amount plus interest (2% above overdraft rate) payable within 30 days",
                "Overpayment: refund limited to preceding 60 days before inspection",
                "Must promptly advise ASX of evidence of Subscriber Firm/End User breach",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.confidentiality,
            description="Confidential Information used solely for Agreement purposes; need-to-know disclosure only.",
            details=[
                "Disclosure permitted: with prior written consent, as required by law, to ASX service providers/advisors/Group/regulators",
                "Remittance reports are confidential to the licensee",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.notification,
            description="Must promptly notify ASX of unauthorised use of MarketSource Products or IP infringement.",
            details=[
                "Must require Subscriber Firms to inform of any such use or infringement",
                "Must discontinue supply to any third party if ASX provides notice of licence breach",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.indemnification,
            description=(
                "Licensee indemnifies ASX, Related Bodies Corporate and Personnel against Losses from: "
                "breach of Agreement, unauthorised use/supply, Subscriber Agreement breach, wilful/fraudulent/negligent acts."
            ),
            details=[
                "Except to the extent ASX has caused or contributed to the Losses",
            ],
        ),
    ]

    fee_details = [
        ComplianceObligation(
            type=ObligationType.notice,
            description="Fees calculated per Fee Schedule; ASX may vary with 90 days notice via ASX Online.",
            details=[
                "Payable in Australian dollars only unless otherwise agreed",
                "Direct billing option available for Subscriber Firms upon request",
                "Late payment: interest at 2% above overdraft rate, accruing daily",
                "Late 2 consecutive months or 3/6 months: immediate audit at customer cost",
                "All taxes, duties (including GST and withholding tax) borne by licensee",
            ],
        ),
    ]
    compliance_obligations.extend(fee_details)

    suspension_provisions = [
        SuspensionProvision(
            trigger="Payment failure",
            notice_period="Immediate",
            cure_period="7 days after receiving notice",
            consequences="Access to MarketSource Products suspended",
        ),
        SuspensionProvision(
            trigger="Unauthorised access to Broker Specific or Restricted Information",
            notice_period="Immediate",
            consequences="Access suspended; ASX must promptly notify",
        ),
        SuspensionProvision(
            trigger="Technical or operational issues causing detriment to ASX systems",
            notice_period="Immediate",
            consequences="Connection suspended",
            requalification_required=True,
        ),
        SuspensionProvision(
            trigger="Unjustified delays or distortions in Information transmission to Subscriber Firms/End Users",
            notice_period="Immediate",
            consequences="Access suspended",
        ),
        SuspensionProvision(
            trigger="Reputational risk to ASX or market integrity",
            notice_period="Immediate",
            consequences="Access suspended",
        ),
        SuspensionProvision(
            trigger="Regulatory direction or applicable law compliance",
            notice_period="Immediate",
            consequences="Access suspended",
        ),
    ]

    termination_provisions = [
        TerminationProvision(
            trigger=TerminationTrigger.breach,
            initiated_by="licensee",
            notice_period="30 days cure period",
            consequences="Termination if ASX fails to remedy material breach within 30 days",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.breach,
            initiated_by="ASX",
            notice_period="30 days cure period",
            consequences="Termination if licensee fails to remedy material breach within 30 days",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.insolvency,
            initiated_by="ASX",
            notice_period="Immediate",
            consequences="Termination without liability upon Insolvency Event",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.suspension_extended,
            initiated_by="ASX",
            notice_period="Immediate",
            consequences="Termination if suspension under clause 22.1 not lifted after >90 days",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.trading_restriction_breach,
            initiated_by="ASX",
            notice_period="Immediate",
            consequences="Termination for breach of trading restriction clause 6.6",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.change_of_control,
            initiated_by="ASX",
            notice_period="Immediate",
            consequences="Termination upon change in direct or indirect beneficial ownership or control",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.convenience,
            initiated_by="either",
            notice_period="90 days prior written notice",
            consequences="Termination without cause",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.format_change,
            initiated_by="licensee",
            notice_period="Immediate",
            consequences="Termination if Format Change is likely to be detrimental (clause 9.3)",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.urgent_change,
            initiated_by="licensee",
            notice_period="Immediate",
            consequences=(
                "Termination if urgent changes to Agreement or Means of Supply are detrimental "
                "(clause 4.5: law changes, regulatory direction, security/technical issues)"
            ),
        ),
    ]

    wind_down = WindDownProvision(
        description=(
            "On termination: licences immediately cease, must destroy all ASX Confidential Information "
            "(Information, Software, Documentation) within 30 days, may retain one backup copy for "
            "archival/record keeping, must provide signed confirmation of destruction upon request."
        ),
        max_duration="30 days",
        conditions=[
            "Must promptly pay all amounts owed",
            "ASX discharged from further obligations after termination date",
            "Surviving clauses: Terms of Licence, Taxes, Liability, Indemnity, IP Rights, Confidentiality, Dispute Resolution",
        ],
    )

    redistribution_restrictions = [
        RedistributionRestriction(
            description="Assignment requires ASX prior written consent (not unreasonably withheld).",
            exceptions=[
                "ASX may assign to any ASX Group member without notice",
                "ASX may assign to any person capable of fulfilling obligations with prior written notice",
            ],
        ),
    ]

    liability = LiabilityProvision(
        liability_cap="12 months' Fees",
        cap_amount="Fees paid or payable during 12 months preceding the events giving rise to liability",
        exclusions=[
            "Consequential Loss (loss of revenue, profits, goodwill, anticipated savings, data, trading losses, opportunity)",
            "Losses from unauthorised use/supply by licensee",
            "Losses from Subscriber Agreement breach",
            "Losses from decisions based on Information",
            "Losses from inaccurate/incomplete Information (except wilful misconduct, fraud, or negligence)",
            "Losses from transmission delays/interruptions (except wilful misconduct, fraud, or negligence)",
        ],
        indemnification=(
            "Licensee indemnifies ASX for: breach of Agreement, unauthorised use/supply, "
            "Subscriber Agreement breach, wilful/fraudulent/negligent acts; "
            "except to extent ASX caused or contributed"
        ),
        ip_indemnification=(
            "ASX indemnifies licensee for IP infringement of Software/Documentation/Information "
            "provided under Agreement, subject to: content not altered/tampered by licensee, "
            "prompt notification, ASX controls defence/settlement, licensee provides reasonable assistance. "
            "ASX may: obtain continued use rights, modify/replace infringing part, or accept return and refund Fees."
        ),
    )

    dispute_resolution = DisputeResolution(
        governing_law="Laws in force in the State of New South Wales",
        arbitration_body=None,
        venue="Courts of New South Wales and appellate courts of the Commonwealth of Australia",
        negotiation_period="7 days executive negotiation before court proceedings",
        court_jurisdiction="Exclusive jurisdiction of NSW courts",
    )

    force_majeure = ForceProvision(
        description=(
            "If a party is wholly or partially unable to perform obligations due to Force Majeure Event, "
            "obligations suspended for duration of delay. If delay continues >60 days, non-affected party "
            "may terminate. If ASX suspends supply, licensee relieved from paying Fees for suspended products."
        ),
        covered_events=[
            "Acts of terrorism",
            "Epidemic",
            "War",
            "Fire",
            "Flood or other accident",
            "Strike",
            "Lock outs",
            "Delays in transport",
            "Material shortages",
            "Restrictions or prohibitions of any government or semi-government authority",
        ],
    )

    document_priority = [
        "Order Form (including Special Conditions)",
        "Guide (Product & Services Guide)",
        "Applicable schedules or addenda",
        "General Terms and Conditions",
    ]

    sections = [
        Section(number=s.number, title=s.title, text=s.text, page=s.page)
        for s in doc.sections
    ]

    return ExchangePolicy(
        exchange="ASX",
        agreement_type=AgreementType.marketsource_agreement,
        agreement_title="MarketSource Agreement — General Terms and Conditions",
        version="2.0 (July 2023)",
        definitions=definitions,
        license_scope=license_scope,
        use_policies=use_policies,
        compliance_obligations=compliance_obligations,
        termination_provisions=termination_provisions,
        wind_down=wind_down,
        redistribution_restrictions=redistribution_restrictions,
        liability=liability,
        dispute_resolution=dispute_resolution,
        suspension_provisions=suspension_provisions,
        subscriber_agreement_requirements=subscriber_agreement_requirements,
        force_majeure=force_majeure,
        document_priority=document_priority,
        sections=sections,
    )
