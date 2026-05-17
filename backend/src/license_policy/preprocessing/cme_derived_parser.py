"""CME Derived Data License Agreement parser."""

from __future__ import annotations

from ..models.enums import (
    AgreementType,
    DataCategory,
    ObligationType,
    TerminationTrigger,
    UseClassification,
)
from ..models.schema import (
    AttributionRequirement,
    ComplianceObligation,
    DataCategoryDefinition,
    DisputeResolution,
    ExchangePolicy,
    FeeStructure,
    LiabilityProvision,
    LicenseScope,
    RedistributionRestriction,
    Section,
    TerminationProvision,
    TransformationRequirement,
    UsePolicy,
    WindDownProvision,
)
from .pdf_extract import ExtractedDocument


def _find_section(doc: ExtractedDocument, number: str) -> str:
    """Find section text by number."""
    for s in doc.sections:
        if s.number == number:
            return s.text
    return ""


def _find_sections_starting_with(doc: ExtractedDocument, prefix: str) -> list[tuple[str, str]]:
    """Find all sections whose number starts with a prefix."""
    results = []
    for s in doc.sections:
        if s.number.startswith(prefix):
            results.append((s.number, s.text))
    return results


def parse_cme_derived(doc: ExtractedDocument) -> ExchangePolicy:
    """Parse CME Derived Data License Agreement into ExchangePolicy."""
    definitions = {d.term: d.body for d in doc.definitions}

    # License scope from Section 2.1
    license_scope = LicenseScope(
        grant_type="non-exclusive, non-transferable, non-sublicensable worldwide license",
        territory="worldwide",
        sublicensable=False,
        transferable=False,
        exclusive=False,
        description=(
            "License to use Information to process, develop, create, calculate, settle, "
            "maintain or support and market Products; and with prior written consent of CME, "
            "distribute Products within the Services."
        ),
    )

    # Data categories from definitions
    data_categories = [
        DataCategoryDefinition(
            category=DataCategory.real_time,
            description="Information made available within 10 minutes of initial transmission.",
            timing_constraint="within 10 minutes",
        ),
        DataCategoryDefinition(
            category=DataCategory.delayed,
            description="Information made available more than 10 minutes but less than 8 hours after initial transmission.",
            timing_constraint="10 min to 8 hours",
        ),
        DataCategoryDefinition(
            category=DataCategory.end_of_day,
            description="Summary data available at end of trading day (settlement, open, high, low, close, etc.).",
            timing_constraint="end of trading day",
        ),
        DataCategoryDefinition(
            category=DataCategory.snapshot,
            description="Information of not more than three specific points in time in a single calendar day, only for derived works.",
            timing_constraint="up to 3 points per day",
        ),
        DataCategoryDefinition(
            category=DataCategory.historical,
            description="Information first accessed at least 8 hours after initial transmission.",
            timing_constraint="8+ hours after transmission",
        ),
    ]

    # Use policies from Section 2
    use_policies = [
        UsePolicy(
            classification=UseClassification.permitted,
            description="Use Information to process, develop, create, calculate, settle, maintain or support and market Products as listed in Appendix A.",
            conditions=["Must have Information Agreement in force", "Subject to Information Policies"],
            source_section="2.1",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="Distribute Products within Services for customers/clients' use within the Services only.",
            conditions=["Requires prior written consent of CME"],
            source_section="2.1(b)",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description=(
                "Creation, calculation, issuance, distribution, settlement, maintenance or support of "
                "derivative works not authorized under this Agreement, including: indexes, ETPs (ETFs, ETNs), "
                "quotes, price assessments, spot or amalgamated prices/values, ratios, curves, surfaces, "
                "charts, certificates, warrants, CFDs and other leveraged products, ETP values (IOPV, NAV/iNAV), "
                "analytical reference figures for fund administration, portfolio management, pre/post-trade analytics, "
                "risk management, or valuation services."
            ),
            source_section="2.3",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Using Information in connection with the trading or support of any commodity or financial product on any exchange or trading platform not designated by CME.",
            source_section="2.12",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Using Information for calculating, distributing, settling, providing liquidity for or maintaining any CFD, binary option, spread bet or any related leveraged product.",
            source_section="2.12",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Using Information to create Futures Contracts or Options on Futures Contracts, or licensing any Product to third parties to create futures or options on futures.",
            source_section="2.13",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Copy, modify, reverse engineer, reverse assemble or reverse compile the Information.",
            source_section="2.8(a)",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="License, sublicense, transfer, sell, resell, publish, reproduce, or otherwise distribute or redistribute the Information.",
            source_section="2.8(b)",
        ),
    ]

    # Transformation requirements from Section 2.4
    transformation_requirements = [
        TransformationRequirement(
            description=(
                "Products must constitute a new, original work that has been derived from the Information "
                "and must not be capable of being used as a substitute for the Information."
            ),
            criteria=[
                "Must constitute a new, original work derived from Information",
                "Must not be capable of being used as a substitute for Information",
                "Must not be capable of reverse engineering to re-create the original Information",
                "Must be used in accordance with the Information Agreement terms",
            ],
            verification_authority="CME has sole discretion to determine if Product meets requirements",
        ),
    ]

    # Fee structure from Section 3
    fee_structure = FeeStructure(
        payment_terms="Payment within 30 days of receipt of invoice from CME.",
        late_penalty="Daily interest at the lower of 1.5% per month or maximum permitted by law.",
        escalation="CME may change/revise Fees with 90 days prior written notice. Annual automatic increase based on IMF CPI if CME does not exercise revision rights.",
        refund="Pro-rated refund only if CME terminates under section 5.1(d). No other refunds.",
        tax="Fees exclusive of applicable taxes (sales, distribution, use, withholding, VAT except taxes on CME net income). Licensee responsible.",
        pro_rata="Fees pro-rated if Effective Date or Appendix A date does not fall on first day of year.",
    )

    # Compliance obligations from Section 7
    compliance_obligations = [
        ComplianceObligation(
            type=ObligationType.record_keeping,
            description="Maintain complete and accurate books of account, records and related documentation relating to use of Information.",
            duration="During Term and 24 months thereafter, for most recent 5 years.",
            details=[
                "Books of account for all Licensee Group entities' use of Information",
                "CME may inspect equipment, devices, software and records",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.audit,
            description="CME may audit at any Licensee Group location during business hours.",
            duration="During Term and up to 24 months following termination.",
            details=[
                "Once per 12-month period on no less than 30 days' notice",
                "Without advance notice if CME suspects material breach",
                "Audit info treated as Confidential Information",
                "Underpayment >5% means Licensee bears audit costs",
                "Outstanding Fees from audit due within 30 days of invoice",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.confidentiality,
            description="Confidential Information held in confidence, not disclosed without consent except to CME Group, Licensee Group, consultants and advisors under similar confidentiality provisions.",
            details=[
                "Standard exceptions: publicly available, already known, independently developed, required by law/regulation",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.disclaimer,
            description="Required disclaimer text must be used in all Informational Material (Appendix E).",
            details=[
                "CME GROUP MARKET DATA IS USED UNDER LICENSE AS A SOURCE OF INFORMATION FOR CERTAIN [LICENSEE] PRODUCTS. "
                "CME GROUP HAS NO OTHER CONNECTION TO [LICENSEE] PRODUCTS AND SERVICES AND DOES NOT SPONSOR, ENDORSE, "
                "RECOMMEND OR PROMOTE ANY [LICENSEE] PRODUCTS OR SERVICES.",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.indemnification,
            description="Licensee indemnifies CME Group entities against all Claims and Damages arising from the Agreement, except gross negligence or willful misconduct by CME.",
        ),
    ]

    # Termination provisions from Section 5
    termination_provisions = [
        TerminationProvision(
            trigger=TerminationTrigger.non_renewal,
            initiated_by="either",
            notice_period="90 days prior to end of Initial Term or current Renewal Term",
            consequences="Agreement terminates at end of term. Wind-down provisions apply.",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.breach,
            initiated_by="either",
            notice_period="Immediate if material irremediable breach; 30 days to cure material breach",
            consequences="Includes: misrepresentation, failure to comply with 2.4, failure to use effective Internal Controls, failure to prevent unauthorized use.",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.fee_revision,
            initiated_by="licensee",
            notice_period="30 days from fee increase notice or Information Policy revision",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.reverse_engineering,
            initiated_by="cme",
            notice_period="Immediate or 90 days written notice",
            consequences="If CME determines Information may be or is being reverse-engineered or misused.",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.change_of_control,
            initiated_by="cme",
            notice_period="Immediate upon notice",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.information_agreement_terminated,
            initiated_by="cme",
            notice_period="Immediate upon notice",
            consequences="If Information Agreement governing receipt of relevant Information is terminated.",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.law_change,
            initiated_by="cme",
            notice_period="Immediate",
            consequences="If changes in law impair CME's ability to provide license.",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.information_change,
            initiated_by="cme",
            notice_period="Immediate",
            consequences="If underlying contract is delisted/substantially changed or CME's rights to license substantially change.",
        ),
    ]

    # Wind-down from Section 5.4
    wind_down = WindDownProvision(
        description="After termination, Licensee may continue using Information for previously issued and outstanding Products requiring orderly wind-down.",
        max_duration="Shorter of: (i) Product remains outstanding, or (ii) 1 year after termination.",
        conditions=[
            "Must continue to pay Fees",
            "Must comply with all Agreement terms",
            "As set out in Appendix A",
            "As required by applicable law or regulation",
        ],
    )

    # Redistribution restrictions
    redistribution_restrictions = [
        RedistributionRestriction(
            description="No Licensee Group entity may license, sublicense, transfer, sell, resell, publish, reproduce or otherwise distribute/redistribute Information.",
            exceptions=["Distribution of Products within Services with prior written CME consent"],
        ),
    ]

    # Liability
    liability = LiabilityProvision(
        liability_cap="Lesser of $100,000 USD or Fees paid in 12 months preceding the event.",
        cap_amount="$100,000",
        exclusions=[
            "No liability for delay, inaccuracies, errors, omissions, interruptions in Information",
            "No liability for loss from unauthorized access or misuse",
            "No consequential, indirect, incidental, special, exemplary or lost profit damages",
            "Information provided 'AS IS' at Licensee's sole risk",
        ],
        indemnification="Licensee indemnifies CME Group against all Claims and Damages except those arising from CME's gross negligence or willful misconduct.",
    )

    # Dispute resolution from Section 9.13
    dispute_resolution = DisputeResolution(
        governing_law="State of Illinois and federal laws of the United States",
        arbitration_body="American Arbitration Association (Commercial Arbitration Rules)",
        venue="Chicago, Illinois",
        language="English",
    )

    # Build sections list
    sections = [
        Section(number=s.number, title=s.title, text=s.text, page=s.page)
        for s in doc.sections
    ]

    return ExchangePolicy(
        exchange="CME",
        agreement_type=AgreementType.derived_data,
        agreement_title="CME Group Derived Data License Agreement",
        definitions=definitions,
        license_scope=license_scope,
        data_categories=data_categories,
        use_policies=use_policies,
        transformation_requirements=transformation_requirements,
        fee_structure=fee_structure,
        compliance_obligations=compliance_obligations,
        termination_provisions=termination_provisions,
        wind_down=wind_down,
        redistribution_restrictions=redistribution_restrictions,
        liability=liability,
        dispute_resolution=dispute_resolution,
        sections=sections,
    )
