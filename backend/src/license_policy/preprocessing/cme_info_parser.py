"""CME Information License Agreement parser."""

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
    InternalControlRequirement,
    LiabilityProvision,
    LicenseScope,
    RedistributionRestriction,
    Section,
    TerminationProvision,
    UsePolicy,
)
from .pdf_extract import ExtractedDocument


def parse_cme_information(doc: ExtractedDocument) -> ExchangePolicy:
    """Parse CME Information License Agreement into ExchangePolicy."""
    definitions = {d.term: d.body for d in doc.definitions}

    # License scope from Section 2.1
    license_scope = LicenseScope(
        grant_type="limited, non-exclusive, non-transferable, non-sublicensable license",
        territory=None,
        sublicensable=False,
        transferable=False,
        exclusive=False,
        description=(
            "License to: (a) receive Information from CME and Data Provider; "
            "(b) use Information as permitted in Schedules; and "
            "(c) create limited derivative works based on Information solely for internal business purposes, "
            "provided derivative works may only be disclosed internally and not distributed to third parties "
            "without prior written CME consent. Separate license required for derivative works beyond this scope."
        ),
    )

    # Data categories from Section 1 definitions
    data_categories = [
        DataCategoryDefinition(
            category=DataCategory.real_time,
            description="Information made available within 10 minutes of initial transmission by the originator.",
            timing_constraint="within 10 minutes",
        ),
        DataCategoryDefinition(
            category=DataCategory.delayed,
            description="Information made available more than 10 minutes but less than 8 hours after initial transmission.",
            timing_constraint="10 min to 8 hours",
        ),
        DataCategoryDefinition(
            category=DataCategory.historical,
            description="Information that is not Real Time or Delayed, first accessed at least 8 hours after initial transmission.",
            timing_constraint="8+ hours after transmission",
        ),
    ]

    # Use policies from Section 2
    use_policies = [
        UsePolicy(
            classification=UseClassification.permitted,
            description="Receive Information from CME and Data Provider.",
            conditions=["Subject to Information Policies and Agreement terms"],
            source_section="2.1(a)",
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Use Information as permitted in the Schedules.",
            conditions=["As specified in Schedules"],
            source_section="2.1(b)",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="Create limited derivative works based on Information solely for internal business purposes.",
            conditions=[
                "Internal disclosure only",
                "No distribution to third parties without prior written CME consent",
                "Separate license required for derivative works beyond this scope",
                "Must comply with Information Policies",
            ],
            source_section="2.1(c)",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Copy, modify, reverse engineer, reverse assemble or reverse compile the Information or any part thereof.",
            source_section="2.2(a)",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="License, sublicense, transfer, sell, resell, publish, reproduce, or otherwise distribute or redistribute the Information.",
            source_section="2.2(b)",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description=(
                "Use Information in the creation, distribution, calculation, issuance, settlement or maintenance of any "
                "derivative work including but not limited to: financial products, futures contracts, options on futures, "
                "synthetic instruments, indexes, index-linked instruments, ETPs (ETFs, ETNs), quotes, price assessments, "
                "spot or amalgamated prices/values, ratios, curves, surfaces, charts, certificates, warrants, "
                "CFDs and other leveraged products, ETP values (IOPV, NAV/iNAV), or any analytical reference figures "
                "for fund administration, portfolio management, pre/post-trade analytics, risk management, or valuation services."
            ),
            source_section="2.2(c)",
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Use Information only for internal business purposes.",
            conditions=["Except as expressly permitted under the Agreement"],
            source_section="2.3",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Text and data mining as defined in EU Directive 2019/790.",
            source_section="3.1",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Use or access Information for any illegal purpose.",
            source_section="2.4",
        ),
    ]

    # Fee structure from Section 6
    fee_structure = FeeStructure(
        payment_terms="Payment within 30 days of date of invoice issued by CME.",
        late_penalty="Daily interest on overdue Fees at lower of 1.5% per month or maximum permitted by law.",
        tax="Fees exclusive of applicable taxes, fees or charges (sales, distribution, use, VAT, etc. except taxes on CME net income). Licensee responsible.",
        unit_of_count="Device (default). If a Device accesses multiple Services, each access counts as one Unit of Count.",
        reporting_requirements="Licensee must report all Units of Count that have the ability to access Information.",
    )

    # Compliance obligations from Sections 4, 7, 8
    compliance_obligations = [
        ComplianceObligation(
            type=ObligationType.internal_controls,
            description="All Licensee Group entities must maintain effective Internal Controls at all times.",
            details=[
                "Identify ability to access Information",
                "Permit access using defined Unit of Count",
                "Prevent unauthorized access to Information",
                "Retain auditable records",
                "Licensee responsible for Fees for all Units of Count with ability to access, whether Internal Controls used or not",
                "Must maintain auditable evidence of Internal Controls operation throughout Term",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.reporting,
            description="All access to Information must be identified and recorded using Unit of Count per Device.",
            details=["Unless stated otherwise in Schedules"],
        ),
        ComplianceObligation(
            type=ObligationType.attribution,
            description="Information must not be misrepresented and must include proper attribution.",
            details=[
                'Legend: "The market data, and all rights in and to it, are the property of Chicago Mercantile Exchange Inc. or its licensors as applicable. All rights reserved, except as expressly licensed by Chicago Mercantile Exchange Inc."',
                "Trademarks/proprietary notices transmitted with Information must not be amended",
                "Delayed Information must be clearly labelled with period of delay",
                "Comply with other reasonable display requirements from CME Group",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.notification,
            description="Licensee must promptly notify CME of any unlicensed activity relating to Information and immediately implement remedial actions.",
        ),
        ComplianceObligation(
            type=ObligationType.notification,
            description="Licensee must promptly notify CME in writing if it becomes aware of non-compliance by any Licensee Group entity.",
        ),
        ComplianceObligation(
            type=ObligationType.record_keeping,
            description="Maintain complete and accurate books and records relating to all Units of Count and Internal Controls.",
            duration="During Term and 24 months thereafter, for most recent 5-year period.",
        ),
        ComplianceObligation(
            type=ObligationType.audit,
            description="CME may audit at any Licensee Group location during business hours.",
            duration="During Term and up to 24 months following termination.",
            details=[
                "Once per 12-month period on no less than 30 days' notice",
                "Without advance notice if CME suspects material breach",
                "Audit info treated confidentially, used only for compliance verification",
                "Outstanding Fees from audit due within 30 days",
                "CME may appoint independent auditor at Licensee's cost if records inadequate",
                "Underpayment >=5% means Licensee bears audit costs",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.personal_data,
            description="Licensee must collect, hold, process and provide Personal Data in accordance with all applicable laws.",
            details=[
                "Must obtain valid consents or satisfy applicable legal basis for data processing",
                "Must ensure cross-border transfers satisfy applicable laws",
                "Must make individuals aware of CME Group's data processing (Privacy Center)",
                "Subject to CME Group's Data Processing Addendum",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.confidentiality,
            description="Confidential Information held in confidence, not disclosed without consent except to CME Group, CME licensors, Licensee Group, and their agents/advisors under similar confidentiality provisions.",
            details=[
                "Standard exceptions: publicly available, already known, independently developed, becomes public through no fault, rightfully known from another source, required by law/regulation",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.indemnification,
            description="Licensee indemnifies CME Group entities against all Claims and Damages from access/use of Information or breach of warranties, except CME willful misconduct.",
        ),
    ]

    # Termination provisions from Section 5
    termination_provisions = [
        TerminationProvision(
            trigger=TerminationTrigger.convenience,
            initiated_by="either",
            notice_period="30 days written notice",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.liquidation,
            initiated_by="either",
            notice_period="Immediate on written notice",
            consequences="If other party enters liquidation, has receiver appointed, or presents winding-up petition.",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.material_breach_irremediable,
            initiated_by="either",
            notice_period="Immediate on written notice",
            consequences="Irremediable breaches include: misrepresentation of Information, failure to use effective Internal Controls, failure to prevent unauthorized use/distribution.",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.breach,
            initiated_by="either",
            notice_period="30 days to remedy after written notice",
            consequences="If other party fails to remedy material breach within 30 days.",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.information_change,
            initiated_by="licensee",
            notice_period="30 days from date change takes effect",
            consequences="If changes to Information significantly alter its nature or materially reduce quality.",
        ),
        TerminationProvision(
            trigger=TerminationTrigger.sublicense_change,
            initiated_by="cme",
            notice_period="Immediate on written notice",
            consequences="If CME's rights to sublicense Information substantially change, or if third-party source rights substantially change.",
        ),
    ]

    # Redistribution restrictions
    redistribution_restrictions = [
        RedistributionRestriction(
            description="No distribution or redistribution of Information or any portion thereof in any manner.",
            exceptions=[
                "Limited derivative works for internal business purposes only (with CME consent for external distribution)",
            ],
        ),
    ]

    # Attribution requirements from Section 4.4
    attribution_requirements = [
        AttributionRequirement(
            legend_text=(
                '"The market data, and all rights in and to it, are the property of Chicago Mercantile Exchange Inc. '
                "or its licensors as applicable. All rights reserved, except as expressly licensed by Chicago Mercantile "
                'Exchange Inc."'
            ),
            trademark_rules="Any trademarks or proprietary notices transmitted with the Information must not be amended.",
            delay_labeling="Delayed Information must be clearly labelled with the period of delay.",
            display_conditions=[
                "Legend must be used to credit CME as source of Information",
                "If not possible to use legend alongside Information, permitted recipients must receive and acknowledge the legend",
                "Information must not be misrepresented or used to create false/misleading impressions as to origin or value",
            ],
        ),
    ]

    # Internal control requirements from Section 4.2
    internal_control_requirements = [
        InternalControlRequirement(
            description="Electronic systems, network configurations, rules, procedures and policies that satisfy CME requirements.",
            requirements=[
                "Identify the ability to access Information",
                "Permit access to Information using a defined Unit of Count",
                "Prevent any unauthorized access to Information",
                "Retain auditable records of the foregoing",
                "Fee liability applies to all Units with ability to access, regardless of whether Internal Controls were used",
                "Must assist CME with prevention, identification and curtailing of unlicensed activity",
                "Must maintain auditable evidence of Internal Controls throughout Term",
            ],
        ),
    ]

    # Liability from Section 9
    liability = LiabilityProvision(
        liability_cap="Lesser of $1,000,000 USD or Fees paid in 12 months preceding the event.",
        cap_amount="$1,000,000",
        exclusions=[
            "No liability for delay, inaccuracies, errors, omissions, interruptions in Information",
            "No liability for loss from unauthorized access or misuse",
            "No consequential, indirect, incidental, special, exemplary or lost profit damages",
            "Information provided 'AS IS' at Licensee's sole risk",
            "No representations/warranties except as expressly stated (merchantability, fitness, accuracy, etc. disclaimed)",
        ],
        indemnification=(
            "Bilateral: CME indemnifies Licensee for IP infringement claims (non-patent) for CME-owned Information used "
            "in compliance, subject to exceptions (derivative works, combination with non-CME products, breach). "
            "Licensee indemnifies CME Group for all Claims from access/use of Information or breach, "
            "except CME willful misconduct."
        ),
    )

    # Dispute resolution from Section 11.13
    dispute_resolution = DisputeResolution(
        governing_law="State of Illinois and federal laws of the United States",
        arbitration_body="American Arbitration Association (Commercial Arbitration Rules)",
        venue="Chicago, Illinois",
        language="English",
    )

    # Refund logic from Sections 5.4/5.5
    fee_structure.refund = (
        "If Licensee terminates, Fees paid in advance retained by CME. "
        "If CME terminates under 5.2(a) or 5.6, or is breaching party, or Licensee terminates under 5.3, "
        "advance Fees for post-termination period refunded."
    )

    # Build sections list
    sections = [
        Section(number=s.number, title=s.title, text=s.text, page=s.page)
        for s in doc.sections
    ]

    return ExchangePolicy(
        exchange="CME",
        agreement_type=AgreementType.information,
        agreement_title="CME Information License Agreement",
        version="5.01",
        definitions=definitions,
        license_scope=license_scope,
        data_categories=data_categories,
        use_policies=use_policies,
        fee_structure=fee_structure,
        compliance_obligations=compliance_obligations,
        termination_provisions=termination_provisions,
        redistribution_restrictions=redistribution_restrictions,
        attribution_requirements=attribution_requirements,
        internal_control_requirements=internal_control_requirements,
        liability=liability,
        dispute_resolution=dispute_resolution,
        sections=sections,
    )
