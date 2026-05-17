"""LSE Schedule B – Market Data Policy parser (January 2025)."""

from __future__ import annotations

from ..models.enums import (
    AgreementType,
    DataCategory,
    ObligationType,
    UseClassification,
    UseContext,
)
from ..models.schema import (
    AttributionRequirement,
    ComplianceObligation,
    DataCategoryDefinition,
    ExchangePolicy,
    LicenseScope,
    NewOriginalWork,
    ProductFamily,
    RedistributionRestriction,
    Section,
    TransformationRequirement,
    UsePolicy,
)
from .pdf_extract import ExtractedDocument


def parse_lse_schedule_b(doc: ExtractedDocument) -> ExchangePolicy:
    """Parse LSE Schedule B – Market Data Policy into ExchangePolicy."""
    definitions = {d.term: d.body for d in doc.definitions}

    core_definitions = {
        "After Midnight Data": "Data distributed after 23:59 on the day that it is disseminated.",
        "ATP": (
            "Alternative trading platform, including trading/betting platforms, platforms for contracts "
            "for difference (CFD), binary options, spread betting instruments and similar instruments."
        ),
        "Brand": "A specific client identity including client name, logo, product name, 'look and feel', and URL.",
        "Data Charges": "Charges identified as such in Schedule A.",
        "Delayed Data": "Data made available 15 minutes after publication, but before midnight on the day of its original publication.",
        "Derived Data": (
            "Any and all data created or derived from the Data using calculations, computations or other "
            "mathematical or other manipulations that (i) cannot be reverse engineered back to the Data, "
            "or (ii) cannot be used as a replacement or substitute for the Data."
        ),
        "Derived Data ATP": "An ATP permitting trading of instruments the price or value of which is based on, or linked to, Derived Data.",
        "Device": (
            "Any terminal (fixed or portable), display unit, or apparatus which may receive or display "
            "the Data, whether in whole or in part."
        ),
        "Display Data": "Data provided or used through the support of a monitor or screen that is human readable.",
        "End Customer": (
            "Any party that receives or has access to the Data, Indices/Benchmarks based on the Data "
            "or Derived Data, including delivered via ATP either directly from the Customer or via one or more Redistributors."
        ),
        "Indices/Benchmarks": "An index as defined under the UK Benchmarks Regulation, or equivalent regulation.",
        "Licence Charges": "Charges identified as such in Schedule A.",
        "Member": "An entity which is also a member of an Exchange and party to the relevant membership agreement.",
        "Natural User": "A unique user with display access to Data.",
        "Non-Display Usage": "The access, processing or use of Real Time Data for purposes other than displaying or disseminating such Data.",
        "Non-Professional Customer": "A Unique User ID who does not meet the definition of Professional Customer.",
        "Other Application Usage": (
            "The use of Real Time Data within applications covering one or more non-trading-based activities "
            "including but not limited to: risk management, quantitative analysis, fund administration, portfolio management."
        ),
        "Private Investor": (
            "A Unique User ID who: subscribes personally; is not a regulated professional securities trader/investment adviser; "
            "does not act as investment adviser; uses the service solely for personal fund management; "
            "does not redistribute or use Data for commercial purposes; "
            "has the charge maintained in the End Customer's name."
        ),
        "Professional Customer": (
            "A customer who uses market data to carry out a regulated financial service or regulated financial activity "
            "or to provide a service for third parties, or who is a large undertaking meeting 2 of: "
            "(i) balance sheet total EUR 20,000,000; (ii) net turnover EUR 40,000,000; (iii) own funds EUR 2,000,000."
        ),
        "Raw Data ATP": "An ATP permitting trading of instruments the price or value of which is based on, or linked to, the Data or data that can be reverse-engineered back to the Data.",
        "Real Time Data": "All Data delivered with a delay of less than fifteen minutes after publication.",
        "Redistributor": "A Customer authorised by an Exchange to disseminate or redistribute the Data externally.",
        "Service Facilitator": (
            "An entity appointed by a Customer that has been approved by an Exchange to facilitate the delivery "
            "of Data to: (1) a Redistributor's End Customers; or (2) additional End Customers of a Derived Data ATP."
        ),
        "Unique User ID": "A unique set of logon information which controls access to Data on a user or Device basis.",
        "Website": "A website or web platform with its own individuality, specific domain name/URL and/or contents and/or Brand.",
    }
    definitions.update(core_definitions)

    license_scope = LicenseScope(
        grant_type="non-exclusive, non-assignable, revocable, worldwide licence",
        territory="Worldwide",
        sublicensable=False,
        transferable=False,
        exclusive=False,
        description=(
            "Cumulative licence grant for each Licensable Activity listed on the Order Form. "
            "All rights are subject to the Limited Licence in the Terms. "
            "Licensable Activities include: Redistribution, Derived Data, Service Facilitation, "
            "Non-Display Usage, and Other Application Usage."
        ),
    )

    product_families = [
        ProductFamily(
            name="UK Market Data",
            description="Level 1 and Level 2 data from the London Stock Exchange (UK equities and other instruments)",
            data_categories=[DataCategory.real_time, DataCategory.delayed, DataCategory.historical],
            use_contexts=[UseContext.display, UseContext.non_display, UseContext.redistribution],
        ),
        ProductFamily(
            name="International Market Data",
            description="Level 1 and Level 2 data from international markets via LSE",
            data_categories=[DataCategory.real_time, DataCategory.delayed, DataCategory.historical],
            use_contexts=[UseContext.display, UseContext.non_display, UseContext.redistribution],
        ),
        ProductFamily(
            name="Turquoise Market Data",
            description="Level 1 and Level 2 data from Turquoise (pan-European equities MTF)",
            data_categories=[DataCategory.real_time, DataCategory.delayed],
            use_contexts=[UseContext.display, UseContext.non_display, UseContext.redistribution],
        ),
    ]

    data_categories = [
        DataCategoryDefinition(
            category=DataCategory.real_time,
            description="Data delivered with a delay of less than 15 minutes after publication.",
        ),
        DataCategoryDefinition(
            category=DataCategory.delayed,
            description="Data made available 15 minutes after publication, but before midnight on the day of original publication.",
            delay_period="15 minutes",
        ),
        DataCategoryDefinition(
            category=DataCategory.historical,
            description="After Midnight Data: Data distributed after 23:59 on the day it is disseminated.",
        ),
        DataCategoryDefinition(
            category=DataCategory.end_of_day,
            description="After Midnight Data delivered via uncontrolled mechanisms (Historical Redistribution licence required).",
        ),
    ]

    use_policies = [
        # --- Redistribution licences ---
        UsePolicy(
            classification=UseClassification.conditional,
            description="Redistribute Data to End Customers via Devices (Core Redistribution Licence).",
            conditions=[
                "Redistribution Licence must be listed on Order Form",
                "May use Trade Marks to support marketing and attribution",
                "Must use operational controls in accordance with Reporting and Audit Schedule",
                "Real Time Data must be password protected unless otherwise specified",
                "Contracts with End Customers must give rights to control and monitor Data use",
                "Must make contents of Schedule B available to End Customers",
                "Any datafeed redistribution must be reported to the Exchange",
                "Sub-vending and use of redistribution Service Facilitators require prior written Exchange approval",
                "Should clearly state Exchange is the original source of Data",
            ],
            source_section="2.4, 3.1",
            use_context=UseContext.redistribution,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="Redistribute Data solely to Private Investor End Customers (Private Investor Redistribution Licence).",
            conditions=[
                "Private Investor Redistribution Licence must be listed on Order Form",
                "No Professional Users may receive data under this licence",
                "If Customer cannot verify Private Investor status, Professional User licence applies",
                "Redistributor must obtain executed Private Investor declaration from each End Customer",
                "Exchange reserves right to contact End Customers to verify eligibility",
            ],
            source_section="3.2",
            use_context=UseContext.redistribution,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Redistribute Delayed Data or After Midnight Data via controlled delivery mechanisms "
                "(Delayed Data / After Midnight Data Redistribution Licence)."
            ),
            conditions=[
                "Applicable licence must be listed on Order Form",
                "Per-Website Licence Charges apply for UK and International market Data",
                "Enterprise licensing required for larger global distribution channels",
                "Turquoise Delayed Data: enterprise basis only",
                "Delayed Data licence for UK market Data includes same level International Data at no extra cost",
                "Charges always due where Redistributor charges End Customers for redistribution",
                "Charge waivers available (with advance written Exchange approval) for: journalistic purposes, "
                "Private Investor personal fund management, educational purposes",
            ],
            source_section="3.3",
            use_context=UseContext.redistribution,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Redistribute After Midnight Data via uncontrolled delivery mechanisms "
                "(Historical Redistribution Licence)."
            ),
            conditions=[
                "Historical Redistribution licence must be listed on Order Form",
                "Applies to delivery via: datafeeds, cloud-based delivery, SFTP, CSV files",
                "Always applies in addition to all other redistribution licences",
                "Licence Charges always apply regardless of other licences held",
            ],
            source_section="3.4",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "End Customers may request a Real Time Level 1 price at a chosen point in time "
                "(Per Price Request Licence)."
            ),
            conditions=[
                "Per Price Request licence must be listed on Order Form",
                "First 300,000 price requests included in Licence Charge; excess charged per request",
                "Data cannot be automatically refreshed on screen",
                "Each individual request must be recorded",
                "One price to 150 Devices = 150 requests",
            ],
            source_section="3.5",
            use_context=UseContext.display,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description="Redistribute individual quotes via TV Devices (TV Ticker Licence).",
            conditions=[
                "TV Ticker licence must be listed on Order Form",
                "End Customers technically unable to onward redistribute the Data",
                "Individual quotes visible for maximum of 5 seconds",
                "Data Charge applies per 1,000 TV Devices",
            ],
            source_section="3.6",
            use_context=UseContext.television,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Issuers listed on the LSE may provide their own Real Time share price "
                "(Live Ticker for Issuers Licence)."
            ),
            conditions=[
                "Live Ticker licence must be listed on Order Form",
                "Only the Issuer's own share price, as Real Time Data",
                "Not subject to Data Charges for the Issuer's own share price",
            ],
            source_section="3.7",
            use_context=UseContext.display,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Issuers may provide up to 4 Delayed Data share prices of relevant LSE-listed securities "
                "(Investor Relations Licence)."
            ),
            conditions=[
                "Investor Relations licence must be listed on Order Form",
                "Licence Charges apply per Website",
                "Exchange determines which securities are 'relevant'",
                "Customer must report URL and name of investor relations Websites to the Exchange",
            ],
            source_section="3.8",
            use_context=UseContext.website,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Redistributors may broadcast limited Real Time Data on open-access Websites to Private Investors "
                "(Last Trade Price Licence)."
            ),
            conditions=[
                "Last Trade Price licence must be listed on Order Form",
                "Data limited to: instrument name, identifier, last traded price, volume, time of trade",
                "No redistribution to Professional Users",
                "No onward dissemination or exporting via API or other channels",
                "Exchange must approve operational controls and Website functionality in advance",
                "Interactive functionality only",
            ],
            source_section="3.9",
            use_context=UseContext.website,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Provide UK/International Data to unlimited eligible internal journalistic personnel "
                "(Enterprise Internal Use Licence for Journalistic Purposes)."
            ),
            conditions=[
                "Enterprise Internal Use for Journalistic Purposes licence must be listed on Order Form",
                "Eligible personnel: employees whose sole purpose is preparation of journalism/journalistic content",
                "No monthly reporting obligations; no additional Data Charges",
                "Annual report of users per Data Product required",
            ],
            source_section="3.10",
            use_context=UseContext.internal_use,
        ),
        # --- Derived Data licences ---
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Calculate and redistribute Indices/Benchmarks using the Data "
                "(Indices/Benchmarks Licence)."
            ),
            conditions=[
                "Indices/Benchmarks licence must be listed on Order Form",
                "Applies irrespective of whether Real Time, Delayed, or After Midnight Data is used",
                "Charges apply per banding based on number of End Customers",
                "Third-party calculation outsourcing: Charges apply to both Customer and third party",
                "Enterprise Charges apply where penultimate banding is exceeded",
                "No Data Charges where appropriate licence is held",
                "Redistribution of raw underlying Data requires a separate licence",
                "Trade Marks required only in documentation linked to Index/Benchmark creation",
            ],
            source_section="4.1",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Calculate and redistribute Derived Data other than Indices/Benchmarks "
                "(Derived Data other than Indices/Benchmarks Licence)."
            ),
            conditions=[
                "Derived Data licence must be listed on Order Form",
                "Applies irrespective of whether Real Time, Delayed, or After Midnight Data is used",
                "No Licence Charges for redistribution solely to Private Investors where Customer technically controls redistribution",
                "Charges apply per banding based on number of End Customers",
                "Enterprise licences apply where penultimate banding is exceeded",
                "Redistribution of raw underlying Data requires a separate licence",
            ],
            source_section="4.2-4.8",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Use Data or Derived Data in connection with the operation of a Raw Data ATP "
                "(Raw Data ATP Licence)."
            ),
            conditions=[
                "Alternative Platform licence must be listed on Order Form",
                "Annual Raw Data ATP Charge applies in addition to Redistribution Licence Charges and Data Charges",
                "Redistribution Service Facilitator rules apply to Raw Data ATPs",
            ],
            source_section="4.9",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Use Data or Derived Data in connection with the operation of a Derived Data ATP "
                "(Derived Data ATP Licence)."
            ),
            conditions=[
                "Alternative Platform licence must be listed on Order Form",
                "Base Annual Charge plus Additional Annual Charge per Natural User exceeding 500",
                "Derived Data White Labels must be listed on Order Form and approved in writing by Exchange",
            ],
            source_section="4.9",
        ),
        # --- Non-Display and Other Application licences ---
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Process Real Time Data for trading-based Non-Display Usage "
                "(Non-Display Usage Licence)."
            ),
            conditions=[
                "Non-Display Usage licence must be listed on Order Form",
                "Applies to all trading-based activity Non-Display Usage of Real Time Data",
                "Charges based on Data Product, level, and number of entitlements",
                "Three categories: Principal (own account), Client Facilitation (customer business), Trading Platforms (MTFs/SIs)",
                "Enterprise banding applies where entitlements cannot be accurately determined",
                "Level 2 licence includes Level 1 Data for remaining entitlements within banding",
                "Includes: automated/semi-automated trading, order pegging, smart order routing, arbitrage, market making",
                "Includes Non-Display Usage in hosted environments",
            ],
            source_section="6.1",
            use_context=UseContext.non_display,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Use Real Time Data for non-trading Other Application Usage "
                "(Other Application Licence)."
            ),
            conditions=[
                "Other Application licence must be listed on Order Form",
                "Covers non-trading activities: risk management, quantitative analysis, fund administration, portfolio management",
                "Charges based on Data Product, level, and number of entitlements",
                "Enterprise banding applies where entitlements cannot be accurately determined",
                "Level 2 licence includes Level 1 Data for remaining entitlements within banding",
            ],
            source_section="6.2",
            use_context=UseContext.non_display,
        ),
        # --- Service Facilitation ---
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Act as a Service Facilitator to enable licensed Redistributors to extend distribution "
                "(Redistribution Service Facilitator Licence)."
            ),
            conditions=[
                "Service Facilitator licence must be listed on Order Form",
                "Redistributor must contract directly with End Customer prior to Data enablement",
                "Redistributor is wholly responsible for compliance with Reporting and Audit Schedule",
                "Redistributor must allocate Unique User IDs",
                "Service Facilitator may modify/database Data only in support of Redistributor's provision",
                "Service Facilitator may not provide Data to non-Redistributor customers",
                "Service Facilitator subject to audit by both Exchange and Redistributor",
                "Where brand is exclusively Redistributor's: no additional charge",
                "Where brand is not exclusively Redistributor's: Service Facilitator Licence Charges apply per Data Product",
                "Exchange reserves right to refuse approval if criteria not satisfactorily fulfilled",
            ],
            source_section="5.1",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Use a Derived Data White Label to extend redistribution of a Derived Data ATP "
                "(Derived Data White Label Licence)."
            ),
            conditions=[
                "Must be listed on Order Form",
                "Prior written Exchange approval required",
                "White Label may receive Data via display Device or API",
                "White Label may rebrand the Derived Data ATP",
                "Fixed Charge applies per Derived Data White Label in addition to Derived Data ATP Charges",
            ],
            source_section="5.2",
        ),
    ]

    transformation_requirements = [
        TransformationRequirement(
            description=(
                "Derived Data must not be reverse-engineerable back to the original Data, "
                "and must not be usable as a replacement or substitute for the Data."
            ),
            criteria=[
                "Cannot be reverse engineered back to the source Data",
                "Cannot be used as a replacement or substitute for the Data",
            ],
            verification_authority="Exchange",
        ),
        TransformationRequirement(
            description=(
                "Indices/Benchmarks must qualify as an index as defined under the UK Benchmarks Regulation "
                "or equivalent regulation."
            ),
            criteria=[
                "Must meet UK Benchmarks Regulation definition (or equivalent)",
            ],
            verification_authority="Exchange",
        ),
    ]

    new_original_works = [
        NewOriginalWork(
            description=(
                "Derived Data (data created from or derived from the Data using calculations, computations, "
                "or other mathematical manipulations) that cannot be reverse-engineered back to the Data "
                "or used as a substitute for the Data."
            ),
            qualification_criteria=[
                "Must not be reverse-engineerable back to the source Data",
                "Must not be usable as a replacement or substitute for the Data",
            ],
            requires_separate_agreement=True,
        ),
        NewOriginalWork(
            description=(
                "Indices/Benchmarks: an index as defined under the UK Benchmarks Regulation "
                "(or equivalent regulation) calculated using LSE Data."
            ),
            qualification_criteria=[
                "Must qualify as an index under UK Benchmarks Regulation",
                "Requires Indices/Benchmarks Licence on Order Form",
            ],
            requires_separate_agreement=True,
        ),
    ]

    compliance_obligations = [
        ComplianceObligation(
            type=ObligationType.reporting,
            description=(
                "Report Data usage to the Exchange in the format, on the frequency, and with the content "
                "specified in Schedule C (Reporting and Audit Schedule)."
            ),
            details=[
                "Data Charges are applicable under certain redistribution policies",
                "Exchange reserves right to request additional reports on reasonable notice",
                "Redistribution Service Facilitator: Redistributor must obtain monthly honesty declarations from End Customers when datafeed delivery is used",
                "Free trial access must be reported monthly",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.access_entitlement_system,
            description="Real Time Data access must be password protected unless otherwise specified.",
            details=[
                "Unique User IDs must be allocated and managed",
                "Contracts with End Customers must grant control and monitoring rights",
                "Redistributors must notify End Customers of Schedule B policy changes",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.notice,
            description=(
                "Charges payable per Customer, per Unit of Count, per Data Product, on a cumulative basis."
            ),
            details=[
                "Licence Charges and Data Charges are separate and cumulative",
                "Member Data Charges (discounts) available for Members at registered locations",
                "Member locations must be notified to Exchange 21 days in advance",
                "Member Data Charges do not apply retrospectively",
                "Free trial: one-off 30-day free trial per Natural User (display) or per End Customer location (datafeed)",
                "Free trials must be approved in writing before commencement",
                "Disaster sites: no Data Charges if never used concurrently with live site",
                "Fee waivers available for: systems monitoring, systems development, marketing, training, educational use (max 10% of fee-liable Devices)",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.attribution,
            description=(
                "Redistributors should clearly state and display that the Exchange is the original source of Data."
            ),
            details=[
                "Should use commercially and technically reasonable efforts",
                "Applies to all redistribution services",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.notice,
            description="Customer may request to change or replace the Order Form with 90 days written notice.",
            details=[
                "Changes take effect on first day of calendar month following end of agreed notice period",
                "Exchange may waive the notice period",
            ],
        ),
    ]

    redistribution_restrictions = [
        RedistributionRestriction(
            description=(
                "Redistributors must not pass on Data to entities that are not End Customers "
                "without separate Exchange approval."
            ),
            service_provider_rules=[
                "Sub-vending (redistribution to other Redistributors) requires prior written Exchange approval",
                "Redistribution Service Facilitators: forbidden from providing Data to non-Redistributor customers",
                "Service Facilitator branding rules determine whether additional Licence Charges apply",
            ],
        ),
        RedistributionRestriction(
            description="Redistributors must not mislead End Customers about Exchange-set Charges.",
            exceptions=[
                "Redistributors are free to set their own prices for End Customers",
                "Must make clear that their price is not the Exchange's price",
            ],
        ),
    ]

    attribution_requirements = [
        AttributionRequirement(
            trademark_rules=(
                "Redistributors should clearly state and display that the Exchange is the original source of Data. "
                "Trade Marks required in documentation linked to Index/Benchmark creation."
            ),
            display_conditions=[
                "Redistribution Service Facilitator where brand is not exclusively Redistributor's: Licence Charges apply",
                "Derived Data White Label: may rebrand but must list on Order Form and obtain Exchange approval",
            ],
        ),
    ]

    sections = [
        Section(number=s.number, title=s.title, text=s.text, page=s.page)
        for s in doc.sections
    ]

    return ExchangePolicy(
        exchange="LSE",
        agreement_type=AgreementType.market_data_policy,
        agreement_title="Schedule B – Market Data Policy",
        version="January 2025",
        definitions=definitions,
        license_scope=license_scope,
        product_families=product_families,
        data_categories=data_categories,
        use_policies=use_policies,
        transformation_requirements=transformation_requirements,
        new_original_works=new_original_works,
        compliance_obligations=compliance_obligations,
        redistribution_restrictions=redistribution_restrictions,
        attribution_requirements=attribution_requirements,
        sections=sections,
    )
