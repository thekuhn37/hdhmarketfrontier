"""ASX Product & Services Guide parser."""

from __future__ import annotations

from ..models.enums import (
    AgreementType,
    DataCategory,
    ObligationType,
    UnitOfCountType,
    UseClassification,
    UseContext,
    UserCategory,
)
from ..models.schema import (
    AccessEntitlementRequirement,
    AttributionRequirement,
    ComplianceObligation,
    DataCategoryDefinition,
    ExchangePolicy,
    FeeWaiver,
    InternalControlRequirement,
    NewOriginalWork,
    ProductFamily,
    RedistributionRestriction,
    Section,
    UsePolicy,
)
from .pdf_extract import ExtractedDocument


def parse_asx_guide(doc: ExtractedDocument) -> ExchangePolicy:
    """Parse ASX Product & Services Guide into ExchangePolicy."""
    definitions = {d.term: d.body for d in doc.definitions}

    product_families = [
        ProductFamily(
            name="MarketSource",
            description=(
                "Market information containing price, volume, market depth and full order book detail "
                "sourced from ASX Trade (equities, ETFs, options, warrants, corporate bonds) and "
                "ASX 24 (futures and options on interest rate, equity index, energy, commodity)."
            ),
            data_categories=[DataCategory.real_time, DataCategory.delayed, DataCategory.end_of_day],
            use_contexts=[
                UseContext.display, UseContext.non_display, UseContext.datafeed,
                UseContext.new_original_work, UseContext.website, UseContext.television,
                UseContext.wallboard,
            ],
        ),
        ProductFamily(
            name="ComNews",
            description=(
                "News service containing company and market announcements made by issuers listed on the ASX."
            ),
            data_categories=[DataCategory.real_time, DataCategory.delayed, DataCategory.announcements],
            use_contexts=[UseContext.display, UseContext.new_original_work],
        ),
        ProductFamily(
            name="ReferencePoint",
            description=(
                "Reference data and analytics products including securities master list, corporate actions, "
                "market share and debt market information. Includes third-party datasets (e.g. GICS) "
                "requiring separate redistribution licences."
            ),
            data_categories=[DataCategory.reference_data, DataCategory.real_time, DataCategory.end_of_day],
            use_contexts=[
                UseContext.internal_use, UseContext.agency, UseContext.display,
                UseContext.datafeed, UseContext.website, UseContext.print_media,
            ],
        ),
    ]

    data_categories = [
        DataCategoryDefinition(
            category=DataCategory.real_time,
            description="Information made available within the delay period of initial dissemination.",
            timing_constraint="within delay period",
        ),
        DataCategoryDefinition(
            category=DataCategory.delayed,
            description="Information delayed by the prescribed period after dissemination.",
            timing_constraint="after delay period",
            delay_period="ASX: 20 minutes; ASX 24: 10 minutes; ComNews: 20 minutes",
        ),
        DataCategoryDefinition(
            category=DataCategory.end_of_day,
            description="Summary data available at end of trading day.",
            timing_constraint="end of trading day",
        ),
        DataCategoryDefinition(
            category=DataCategory.announcements,
            description="Company and market announcements from ASX-listed issuers (ComNews).",
            timing_constraint="real-time or 20-minute delay",
            delay_period="20 minutes",
        ),
        DataCategoryDefinition(
            category=DataCategory.reference_data,
            description="Securities master list, corporate actions, market share, debt market information (ReferencePoint).",
        ),
    ]

    # --- Use policies from Section 2.2 ---
    use_policies = [
        # Distributor licensed uses
        UsePolicy(
            classification=UseClassification.permitted,
            description="Display Real Time Information on a Device to End Users in a Closed User Group.",
            conditions=["Requires MarketSource Agreement", "Requires Access & Entitlement System"],
            source_section="2.2",
            use_context=UseContext.display,
            applicable_product_families=["MarketSource"],
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Display Delayed and End of Day Information on a Device to End Users in a Closed or Open User Group.",
            conditions=["Requires Delayed Data Licence or payment of real-time enquiry fees"],
            source_section="2.2",
            use_context=UseContext.display,
            applicable_product_families=["MarketSource"],
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Create and display Derived Information on a Device.",
            conditions=["Fees for Derived Information are same as for source data timeliness"],
            source_section="2.2",
            use_context=UseContext.display,
            applicable_product_families=["MarketSource"],
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Disseminate Information as a Datafeed or API to Subscriber Firms for their internal use only.",
            conditions=[
                "Subscriber Firms must have Access & Entitlement System",
                "Subscriber Firms must report appropriate Unit of Count monthly",
            ],
            source_section="2.2",
            use_context=UseContext.datafeed,
            applicable_product_families=["MarketSource"],
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="Use Information for creating New Original Works (e.g. financial indices over a basket of securities).",
            conditions=[
                "Requires separate direct agreement with ASX",
                "Licence fees may apply for external distribution",
                "ASX reserves right to determine if output qualifies as New Original Work",
            ],
            source_section="2.2.4",
            use_context=UseContext.new_original_work,
            applicable_product_families=["MarketSource"],
        ),
        # Non-Display uses
        UsePolicy(
            classification=UseClassification.permitted,
            description="Use Information internally in Non-Display Applications (algo trading, surveillance, risk management, etc.).",
            conditions=["Requires MarketSource Agreement", "Must report per Application"],
            source_section="2.2.3",
            use_context=UseContext.non_display,
            applicable_product_families=["MarketSource"],
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Use Information within a Reference Based System operated by a Trade Execution Venue.",
            conditions=["Unit of Count is per Trade Execution Venue"],
            source_section="2.2.3",
            use_context=UseContext.non_display,
            applicable_product_families=["MarketSource"],
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="Market Operator regulatory feed for fulfilling ASIC Market Integrity Rules obligations.",
            conditions=["Must be a licensed Market Operator"],
            source_section="2.2.3",
            use_context=UseContext.non_display,
            applicable_product_families=["MarketSource"],
        ),
        # Prohibitions
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Use, store, reproduce, display, modify, transmit or distribute Information without prior ASX permission.",
            source_section="2.2.1.2",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Feed downloaded Display data into Non-Display Applications.",
            conditions=["Download functionality (e.g. DDE) is for End User research/analysis only"],
            source_section="2.2.1.1",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Concurrent usage, contention or licence sharing schemes.",
            source_section="2.3.1",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Use Time-based option to generate snapshots for subsequent off-line viewing.",
            source_section="2.3.3",
        ),
        UsePolicy(
            classification=UseClassification.prohibited,
            description="Honesty statements or manual procedures as substitute for Access & Entitlement Systems.",
            source_section="2.2.2",
        ),
        # Conditional uses
        UsePolicy(
            classification=UseClassification.conditional,
            description="Web-hosting or outsourcing of Real Time Information display requires prior ASX approval per website.",
            conditions=[
                "Must maintain end-to-end technical control",
                "Must have agreement with website owner/operator",
                "Must be clearly branded/co-branded",
                "Distributor unconditionally guarantees compliance",
                "ASX may require direct agreement at any time",
            ],
            source_section="2.1.4",
            use_context=UseContext.website,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="Wallboard/ticker display of Delayed or EOD Information in public areas.",
            conditions=[
                "Requires prior ASX approval",
                "Must clearly indicate data is delayed or EOD",
                "S&P/ASX indices may be displayed in real-time",
            ],
            source_section="2.2.1",
            use_context=UseContext.wallboard,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="Television display: free-to-air limited to Delayed; subscription TV may carry Real Time.",
            conditions=["Unit of Count for subscription TV is subscriber households"],
            source_section="2.2.1",
            use_context=UseContext.television,
        ),
        # ComNews specific
        UsePolicy(
            classification=UseClassification.permitted,
            description="Display ComNews Real Time Information in a Closed User Group.",
            conditions=["Requires ComNews Agreement"],
            source_section="3.2.1",
            use_context=UseContext.display,
            applicable_product_families=["ComNews"],
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="ComNews New Original Works extraction requires separate licence.",
            conditions=["Standard ComNews Agreement does not permit extraction for New Original Works"],
            source_section="3.2.2",
            use_context=UseContext.new_original_work,
            applicable_product_families=["ComNews"],
        ),
        # ReferencePoint specific
        UsePolicy(
            classification=UseClassification.permitted,
            description="ReferencePoint Internal Usage: use by personnel with ad-hoc limited extracts to clients.",
            conditions=["Limited to insubstantial amounts of static information"],
            source_section="4.2",
            use_context=UseContext.internal_use,
            applicable_product_families=["ReferencePoint"],
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="ReferencePoint Agency Licence: agency/outsourced services (back office, asset administration).",
            source_section="4.2",
            use_context=UseContext.agency,
            applicable_product_families=["ReferencePoint"],
        ),
        UsePolicy(
            classification=UseClassification.permitted,
            description="ReferencePoint Vendor Display: display on a branded Device with Access & Entitlement System.",
            conditions=["Must be branded to identify Distributor", "Must control Access & Entitlement System"],
            source_section="4.2",
            use_context=UseContext.display,
            applicable_product_families=["ReferencePoint"],
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="ReferencePoint third-party datasets (e.g. GICS) require separate redistribution licence from originator.",
            conditions=["Internal use permitted", "Redistribution requires licence from data provider (e.g. S&P for GICS)"],
            source_section="4.2",
            use_context=UseContext.redistribution,
            applicable_product_families=["ReferencePoint"],
        ),
    ]

    # --- New Original Works ---
    new_original_works = [
        NewOriginalWork(
            description=(
                "Creation of financial indices or other new works over a basket of securities using ASX data. "
                "ASX reserves all rights to determine whether processed Information qualifies."
            ),
            qualification_criteria=[
                "Output cannot be recognised as, traced back to or reverse engineered as ASX data",
                "Must constitute a genuinely new work",
                "ASX has sole discretion on qualification",
            ],
            requires_separate_agreement=True,
            calculator_fees={
                "real_time": "$5,000/month per calculator",
                "delayed": "$4,000/month per calculator",
                "end_of_day": "$3,000/month per calculator",
            },
        ),
    ]

    # --- Compliance obligations ---
    compliance_obligations = [
        ComplianceObligation(
            type=ObligationType.access_entitlement_system,
            description="Mandatory Access & Entitlement System for all Real Time Information.",
            details=[
                "Must assign unique IDs to every End User, Device, Application, or Reference Based System",
                "No sharing of unique User IDs",
                "No concurrent access from multiple devices with same ID",
                "Must report specific and unique IDs monthly",
                "Honesty statements and manual declarations are not acceptable",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.reporting,
            description="Monthly remittance reports detailing use of Information by Unit of Count.",
            details=[
                "Submit via ASX Data Reporting Module (DRM) at https://asxdrm.com.au",
                "Accepted formats: CSV, VRXML, VARS, or online DRM form",
                "Processing Fee charged for non-DRM submission",
                "All use (fee-waived and fee-liable) must be reported",
                "Reports must separate ASX vs ASX 24, Professional vs Non-Professional, billable vs non-billable",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.reporting_format,
            description="Reports must include subscriber names, service codes, reporting codes, quantities, and location IDs.",
            details=[
                "Monthly reports due by 22nd of each month/quarter",
                "Delayed Market Detail: bi-annual reporting (22nd day following July 1 and January 1)",
                "ReferencePoint Vendor Display: annual reporting within 60 days before June 30",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.record_keeping,
            description="Retain all books, records, system logs and Access & Entitlement records.",
            duration="At least 5 years from date generated.",
            details=[
                "Must validate usage and accurately calculate Fees",
                "Distributors must ensure customers also retain necessary records",
                "Print Media: records of publication names, countries, circulation, dates",
                "Website Licence: quarterly records of website name, owner, URL, scope, dates",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.audit,
            description="Comprehensive program of remote and on-site audits managed through external consultants.",
            duration="Typically covers 5-year timeframe.",
            details=[
                "Must demonstrate Access & Entitlement Systems, billing, administration and collection procedures",
                "Preliminary report issued after review",
                "14-day written response window after preliminary report",
                "Final report prepared considering response",
                "Audit may extend to Related Bodies Corporate, Service Facilitators, Subscriber Firms",
                "Covers: receipt/use of Information, controls over Sub-vendors, A&E system validation, Non-Display access",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.disclaimer,
            description="Mandatory disclaimers for delayed and EOD data on all screens, internet pages and wallboard tickers.",
            details=[
                "Must identify that Information is delayed by prescribed period or is EOD Information",
                "Wallboard tickers: delay message every 90 seconds",
                "Website display must include IP rights notice and no-responsibility disclaimer",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.attribution,
            description="Limited Extracts must be attributed to ASX. Display Services must be branded to identify Distributor.",
            details=[
                "Web-hosted services must be clearly branded/co-branded",
                "API Software must mark copies to indicate NASDAQ owns IP rights",
            ],
        ),
    ]

    # --- Attribution requirements ---
    attribution_requirements = [
        AttributionRequirement(
            legend_text=(
                "ASX, ASX Group, suppliers and their licensors reserve all Intellectual Property Rights "
                "in the Information. They accept no responsibility for any claim, loss or damage arising "
                "from the display of Information or any use thereof."
            ),
            trademark_rules="Must not alter or remove trade/service marks on API Software (NASDAQ IP).",
            delay_labeling=(
                "Delayed Information must be clearly labelled with the period of delay. "
                "Wallboard tickers must show delay message every 90 seconds."
            ),
            display_conditions=[
                "Display Services must be prominently branded to identify the Distributor",
                "Web-hosted services must be clearly branded or co-branded",
                "Limited Extracts must be attributed to ASX",
            ],
        ),
    ]

    # --- Internal control requirements ---
    internal_control_requirements = [
        InternalControlRequirement(
            description="Access & Entitlement System requirements for all Real Time Information.",
            requirements=[
                "Assign unique user ID and password or approved security mechanism to every End User",
                "Ensure End Users do not share unique User IDs",
                "Ensure unique user ID cannot access Information on more than one Device simultaneously",
                "Track and report all Units of Count (End Users, Devices, Applications, Reference Based Systems)",
                "No concurrent usage, contention or licence sharing schemes",
            ],
        ),
    ]

    # --- Access & Entitlement requirements ---
    access_entitlement_requirements = [
        AccessEntitlementRequirement(
            description=(
                "All Distributors and Subscriber Firms must use an Access & Entitlement System "
                "to permission and record access to Real Time Information."
            ),
            unique_id_required=True,
            concurrent_access_prohibited=True,
            qualification_test_required=True,
            approved_system_required=True,
        ),
    ]

    # --- Redistribution restrictions ---
    redistribution_restrictions = [
        RedistributionRestriction(
            description="End Users may not redistribute Information except as limited extracts per section 10.1.",
            exceptions=[
                "Ad-hoc, non-continuous limited extracts of static Information in written/oral communication",
                "Must be attributed to ASX",
                "Must not constitute regular or systematic distribution",
                "Must not involve Real Time or continuously updating Information",
            ],
            service_provider_rules=[
                "Distributors must provide this Guide to Subscriber Firms",
                "Trade Execution Venue operators may distribute Derived Information from reference-priced trades as part of regular data feed",
                "Derived Information from Trade Execution Venues may not be used for issuing/pricing financial products or creating New Original Works without separate licence",
            ],
        ),
    ]

    # --- Fee waivers (documented in guide, actual amounts in fee schedule) ---
    fee_waivers = [
        FeeWaiver(
            description="Academic Waiver: monthly ASX and ASX 24 Enquiry Fees waived for up to 30 Devices.",
            conditions=[
                "Australian university with appropriate academic program",
                "Must submit written request with university name, program, device count, student/faculty count",
                "Requires signed letter from university acknowledging ASX IP rights",
                "Does not cover NTP access or telecommunication charges",
            ],
            applies_to="academic",
        ),
        FeeWaiver(
            description="Trial/Demo: free Real Time access for limited number of End Users for limited time.",
            conditions=[
                "Max 50 or 5% of total Continuous Enquiries (whichever is greater)",
                "Max 30 consecutive days per trial",
                "Once per lifetime of each Device/End User",
                "Strictly for trial and demonstration purposes",
            ],
            applies_to="trial_demo",
        ),
        FeeWaiver(
            description="Administrative Usage: fee-waived for internal staff (sales demos, testing).",
            conditions=[
                "Max 50 or 5% of total Continuous Enquiries (whichever is greater)",
                "Not required in remittance report but must provide on request",
                "End Users with ability to alter/control Non-Display Application are excluded",
            ],
            applies_to="administrative",
        ),
        FeeWaiver(
            description="Disaster Recovery / BCP Sites: no Enquiry or Non-Display fees.",
            conditions=[
                "Intended for customers who normally pay Fees at live site",
                "Never used concurrently with Devices at live sites",
                "Should not have greater access than main site",
                "Connectivity and Access Fees still apply",
            ],
            applies_to="disaster_recovery",
        ),
    ]

    # Build sections list
    sections = [
        Section(number=s.number, title=s.title, text=s.text, page=s.page)
        for s in doc.sections
    ]

    return ExchangePolicy(
        exchange="ASX",
        agreement_type=AgreementType.product_guide,
        agreement_title="ASX Information Services: Product and Services Guide",
        version="2.30",
        definitions=definitions,
        product_families=product_families,
        data_categories=data_categories,
        use_policies=use_policies,
        new_original_works=new_original_works,
        fee_structure=None,  # Fees are in the separate fee schedule document
        compliance_obligations=compliance_obligations,
        redistribution_restrictions=redistribution_restrictions,
        attribution_requirements=attribution_requirements,
        internal_control_requirements=internal_control_requirements,
        access_entitlement_requirements=access_entitlement_requirements,
        sections=sections,
    )
