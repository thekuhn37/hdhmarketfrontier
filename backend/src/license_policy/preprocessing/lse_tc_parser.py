"""LSE Market Data Terms and Conditions parser (January 2025)."""

from __future__ import annotations

from ..models.enums import (
    AgreementType,
    ObligationType,
    TerminationTrigger,
    UseClassification,
    UseContext,
)
from ..models.schema import (
    AttributionRequirement,
    ComplianceObligation,
    DisputeResolution,
    ExchangePolicy,
    LiabilityProvision,
    LicenseScope,
    Section,
    SuspensionProvision,
    TerminationProvision,
    WindDownProvision,
)
from .pdf_extract import ExtractedDocument


def parse_lse_terms_and_conditions(doc: ExtractedDocument) -> ExchangePolicy:
    """Parse LSE Market Data Terms and Conditions into ExchangePolicy."""
    definitions = {d.term: d.body for d in doc.definitions}

    license_scope = LicenseScope(
        grant_type="non-exclusive, non-transferable, revocable, worldwide licence",
        territory="Worldwide",
        sublicensable=False,
        transferable=False,
        exclusive=False,
        description=(
            "Limited Licence: (i) internal use of Data; "
            "(ii) limited, inconsequential, insubstantial extraction on a non-systematic, ad-hoc basis "
            "that cannot substitute the Data and has no separate commercial value; "
            "(iii) backup/storage for compliance with the Reporting and Audit Schedule, "
            "internal financial record keeping, and applicable law. "
            "Licensable Activities (beyond the Limited Licence) require an executed Order Form (clause 2.3)."
        ),
    )

    from ..models.schema import UsePolicy
    use_policies = [
        UsePolicy(
            classification=UseClassification.permitted,
            description="Use the Data for limited internal use.",
            source_section="2.1.1",
            use_context=UseContext.internal_use,
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description=(
                "Utilise, distribute, or extract limited, inconsequential, insubstantial amounts of Data "
                "on an ad-hoc, non-systematic basis, provided such use cannot substitute the Data and "
                "has no separate commercial value."
            ),
            source_section="2.1.2",
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description=(
                "Back up and store the Data for: (i) compliance with Reporting and Audit Schedule; "
                "(ii) internal financial record keeping; (iii) compliance with applicable law."
            ),
            source_section="2.1.3",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Use the Data for Licensable Activities (redistribution, derived data, non-display, "
                "service facilitation, and other activities listed in the Market Data Policy Schedule)."
            ),
            conditions=[
                "Requires an executed Order Form specifying the Licensable Activities",
                "Must comply with the Market Data Policy Schedule terms",
                "Redistribution to third parties requires Customer to procure recipient compliance with the Limited Licence",
                "Must attribute the source of Data to the Exchange using the relevant Trade Mark",
            ],
            source_section="2.3",
            use_context=UseContext.redistribution,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="Subsidiaries may use the Data under the Agreement.",
            conditions=[
                "Subsidiaries must be specifically listed on an executed Order Form",
                "Customer is liable for any Subsidiary breach",
                "Subsidiaries are not third-party beneficiaries under the Agreement",
            ],
            source_section="3.1",
        ),
    ]

    compliance_obligations = [
        ComplianceObligation(
            type=ObligationType.reporting,
            description=(
                "Provide applicable reporting to the Exchanges in accordance with the "
                "Market Data Policy Schedule and the Reporting and Audit Schedule."
            ),
            details=[
                "Not applicable to Customers solely subject to the Data Shop Agreement",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.audit,
            description=(
                "Allow each Exchange and their agents access to operational controls, systems, "
                "records and other documents relating to the Service; permit copies/extracts to verify compliance."
            ),
            details=[
                "Must comply with the Reporting and Audit Schedule",
                "Must supply copies of records on demand",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.notice,
            description="Pay Charges within 30 calendar days of receipt of invoice by bank transfer.",
            details=[
                "Charges subject to VAT and applicable taxes at prescribed rate",
                "Customer responsible for timely payment of all taxes",
                "Interest on overdue payments: Bank of England base rate plus 8% per annum, accrued daily",
                "Exchange may suspend Service if payment overdue >30 calendar days",
                "Exchange may suspend Service if audit submission delayed >30 calendar days",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.confidentiality,
            description="Both parties shall keep confidential all Confidential Information.",
            details=[
                "Disclosure permitted to: auditors, lawyers, professional advisers (need-to-know basis)",
                "Disclosure permitted to the party's Group",
                "Disclosure permitted to regulatory/governmental authorities as required",
                "Recipients must be bound by similar confidentiality obligations",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.internal_controls,
            description=(
                "Comply with applicable Technical Specifications and maintain satisfactory "
                "communication infrastructure to receive the Service."
            ),
            details=[
                "Customer bears all costs for connecting and maintaining its own equipment",
                "30 days notice of technical changes (except for legal/emergency changes)",
                "Customer may terminate within 30 days if technical changes are materially adverse",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.attribution,
            description=(
                "Attribute the source of Data to the Exchange using the relevant Trade Mark "
                "when providing Data to third parties under Licensable Activities."
            ),
            details=[
                "Trade Marks include: London Stock Exchange®, London Stock Exchange Group®, "
                "TRADEcho®, Turquoise®",
            ],
        ),
    ]

    suspension_provisions = [
        SuspensionProvision(
            trigger="Customer overdue payment exceeding 30 calendar days",
            notice_period="Written notice",
            cure_period="30 days from receipt of notice",
            consequences="Exchange may suspend Service",
        ),
        SuspensionProvision(
            trigger="Audit submission delayed more than 30 calendar days",
            notice_period="Written notice",
            cure_period="30 days from receipt of notice",
            consequences="Exchange may suspend Service",
        ),
        SuspensionProvision(
            trigger="Customer ceases to have satisfactory communications facilities",
            notice_period="Notice from Exchange",
            cure_period="30 days to remedy",
            consequences="Exchange may terminate or suspend Service without liability",
        ),
        SuspensionProvision(
            trigger="Required by applicable law or directed by competent regulator",
            notice_period="Immediate",
            consequences="Exchange may terminate or suspend Service without liability",
        ),
        SuspensionProvision(
            trigger="Service generally terminated or suspended by Exchange",
            notice_period="As practicable",
            consequences="Exchange may suspend Service; Customer may request pro-rata refund of pre-paid Charges",
        ),
        SuspensionProvision(
            trigger="Necessary to maintain security or integrity of Service or prevent misuse",
            notice_period="Immediate",
            consequences="Exchange may suspend Service without liability",
        ),
    ]

    termination_provisions = [
        TerminationProvision(
            trigger=TerminationTrigger.convenience,
            initiated_by="either",
            notice_period="90 calendar days written notice",
            consequences=(
                "Effective after Initial Term or 12 months from Commencement Date (whichever is later). "
                "Customer may request pro-rata refund of pre-paid Charges."
            ),
        ),
        TerminationProvision(
            trigger=TerminationTrigger.insolvency,
            initiated_by="either",
            notice_period="Immediate written notice",
            consequences="Immediate termination upon insolvency, liquidation, receivership, or cessation of business",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.breach,
            initiated_by="either",
            notice_period="30 calendar days cure period",
            consequences=(
                "Immediate termination if material breach (including non-payment) not remedied within 30 days "
                "of written notice requiring remedy."
            ),
        ),
        TerminationProvision(
            trigger=TerminationTrigger.convenience,
            initiated_by="customer",
            notice_period="30 calendar days written notice",
            consequences=(
                "Customer may terminate a specific Licensable Activity from the Order Form with 90 days notice "
                "(or 30 days if an adverse amendment is made). Other licences remain unaffected."
            ),
        ),
        TerminationProvision(
            trigger=TerminationTrigger.law_change,
            initiated_by="exchange",
            notice_period="Immediate",
            consequences="Exchange terminates regulatory authorisation to manage relevant financial markets",
        ),
    ]

    wind_down = WindDownProvision(
        description=(
            "Post-termination, Customer may store and use Data collected during the Agreement term only "
            "where such storage and use is for compliance with applicable laws, regulatory obligations, "
            "or other reasons approved in writing by the Exchange."
        ),
        conditions=[
            "Surviving clauses: 5.7, 5.8, 6, 7, 8.7, 10, 14, 15, 16, 17",
        ],
    )

    attribution_requirements = [
        AttributionRequirement(
            trademark_rules=(
                "Must attribute the source of Data to the Exchange using the relevant Trade Mark "
                "when redistributing or providing Data to third parties under Licensable Activities. "
                "Trade Marks: London Stock Exchange®, London Stock Exchange Group®, TRADEcho®, Turquoise®."
            ),
            display_conditions=[
                "Attribution required when providing Data to any third party under clause 2.3",
                "Goodwill generated from Trade Mark use belongs solely to the relevant Exchange",
            ],
        ),
    ]

    liability = LiabilityProvision(
        liability_cap="12 months of Charges paid",
        cap_amount=(
            "For LSE: total Charges paid for LSE Service in 12 months preceding first event giving rise to Claim. "
            "For TGHL: total Charges paid for TGHL Service in 12 months preceding first event giving rise to Claim."
        ),
        exclusions=[
            "Indirect, special, or consequential Loss",
            "Loss of profits, revenue, anticipated savings, goodwill, opportunity, or wasted expenditure",
            "Loss of, damage to, or corruption of data",
            "Loss or damage from Claims by Customer's clients",
            "Decisions based on the Data or inaccuracy/incompleteness/error in the Data",
            "Service interruption, change, or unavailability",
        ],
        indemnification=(
            "Customer indemnifies each Exchange from third-party Claims and Losses arising from: "
            "(i) use of the Service by the Customer or any third party because of the Customer; "
            "(ii) Claims by Customer's Subsidiaries in respect of the Agreement."
        ),
        ip_indemnification=(
            "Each Exchange indemnifies Customer and its directors, officers, employees, and agents from "
            "third-party Claims and Losses arising from allegations that the use of Data or Trade Marks "
            "licensed under the Agreement infringes such third party's Intellectual Property Rights. "
            "Exchange may: obtain continued use rights, replace/modify infringing Data."
        ),
    )

    dispute_resolution = DisputeResolution(
        governing_law="Laws of England and Wales",
        venue="Courts of England and Wales",
        court_jurisdiction="Exclusive jurisdiction of the courts of England and Wales",
    )

    document_priority = [
        "Order Form",
        "Data Shop Schedule (where applicable)",
        "Terms and Conditions",
        "Price List and Data Product Schedule",
        "Other Schedules",
    ]

    # Pull key definitions from clause 19
    core_definitions = {
        "Agreement": "These Terms, an Order Form, and the applicable Schedules.",
        "Limited Licence": (
            "The licence granted under clause 2.1: internal use, limited inconsequential extraction, "
            "and backup/storage for compliance purposes."
        ),
        "Licensable Activities": (
            "Any use of Data which is subject to additional licensing as described in the Market Data "
            "Policy Schedule and the Price List and Data Product Schedule."
        ),
        "Initial Term": "The Commencement Date until 31st December in the same calendar year.",
        "Renewal Term": "A one-year period following the expiry of the Initial Term (1 January – 31 December).",
        "Data": "The data provided by the Exchanges under the Agreement.",
        "Data Products": "The categories of Data content as set out in the Price List and Data Product Schedule.",
        "Customer": "The natural and/or legal person or entity named in the Order Form.",
        "Subsidiaries": "Those subsidiaries of the Customer as set out in the Order Form.",
        "Exchange": "Either LSE or TGHL; 'Exchanges' means both.",
        "LSE": "London Stock Exchange plc.",
        "TGHL": "Turquoise Global Holdings Limited.",
        "TGHE": "Turquoise Global Holdings Europe B.V.",
        "Group": (
            "In relation to an entity, any other entity that Controls, is Controlled by, "
            "or is under common Control with that entity."
        ),
        "Market Data Policy Schedule": "Schedule B of the Agreement.",
        "Price List and Data Product Schedule": "Schedule A of the Agreement.",
        "Reporting and Audit Schedule": "Schedule C of the Agreement.",
        "Data Shop Agreement": (
            "Independent and separate agreement for Data Shop Products between the Customer "
            "and the relevant Exchange."
        ),
        "Intellectual Property Rights": (
            "All patents, copyrights, trade marks, service marks, database rights, "
            "and all other intellectual property rights, whether registered or unregistered, worldwide."
        ),
        "Confidential Information": (
            "(i) Terms of the Agreement; (ii) confidential/proprietary information about financial affairs "
            "or business operations; (iii) all communications relating to the Agreement or Service. "
            "Excludes: public domain information, independently obtained information, "
            "legally required disclosures, independently developed information."
        ),
        "Charges": "Fees as identified as such in the Price List and Data Product Schedule.",
        "Service": "The provision by the relevant Exchange (directly or indirectly) of the Data as set out in the Order Form.",
    }
    definitions.update(core_definitions)

    sections = [
        Section(number=s.number, title=s.title, text=s.text, page=s.page)
        for s in doc.sections
    ]

    return ExchangePolicy(
        exchange="LSE",
        agreement_type=AgreementType.terms_and_conditions,
        agreement_title="London Stock Exchange Market Data Terms and Conditions",
        version="January 2025",
        definitions=definitions,
        license_scope=license_scope,
        use_policies=use_policies,
        compliance_obligations=compliance_obligations,
        suspension_provisions=suspension_provisions,
        termination_provisions=termination_provisions,
        wind_down=wind_down,
        attribution_requirements=attribution_requirements,
        liability=liability,
        dispute_resolution=dispute_resolution,
        document_priority=document_priority,
        sections=sections,
    )
