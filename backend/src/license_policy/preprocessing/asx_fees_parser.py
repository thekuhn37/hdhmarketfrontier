"""ASX Information and Technical Services Fee Schedule parser."""

from __future__ import annotations

from ..models.enums import (
    AgreementType,
    DataCategory,
    UnitOfCountType,
    UserCategory,
)
from ..models.schema import (
    BenchmarkLicense,
    ExchangePolicy,
    FeeLine,
    FeeStructure,
    FeeWaiver,
    ProductFamily,
    Section,
    TierBand,
)
from .pdf_extract import ExtractedDocument


def parse_asx_fees(doc: ExtractedDocument) -> ExchangePolicy:
    """Parse ASX Fee Schedule into ExchangePolicy."""

    product_families = [
        ProductFamily(
            name="MarketSource",
            description="Market information fees for ASX and ASX 24 price data.",
            data_categories=[DataCategory.real_time, DataCategory.delayed, DataCategory.end_of_day],
        ),
        ProductFamily(
            name="ComNews",
            description="Market announcements fees.",
            data_categories=[DataCategory.announcements],
        ),
        ProductFamily(
            name="ReferencePoint",
            description="Reference data and analytics product fees.",
            data_categories=[DataCategory.reference_data],
        ),
        ProductFamily(
            name="Benchmarks",
            description="BBSW and Realised AONIA benchmark data fees.",
            data_categories=[DataCategory.benchmark],
        ),
        ProductFamily(
            name="Historical",
            description="Historical data fees for internal use and vendor publications.",
            data_categories=[DataCategory.historical],
        ),
    ]

    # --- MarketSource fees ---
    marketsource_fees = [
        FeeLine(
            description="ASX Professional Enquiry Fee - Continuous real-time for Display.",
            unit_of_count=UnitOfCountType.per_user,
            user_category=UserCategory.professional,
            amount="$142",
            frequency="monthly",
            effective_date="1 Jan 2026",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX Retail Enquiry Fee - Non-professional continuous real-time for Display.",
            unit_of_count=UnitOfCountType.per_user,
            user_category=UserCategory.non_professional,
            amount="$20",
            frequency="monthly",
            effective_date="1 Jul 2014",
            product_family="MarketSource",
        ),
        FeeLine(
            description="Price Per ASX Quote - Single Enquiry.",
            unit_of_count=UnitOfCountType.per_query,
            amount="$0.005",
            frequency="monthly",
            effective_date="1 Jul 2013",
            product_family="MarketSource",
        ),
        FeeLine(
            description="Price Per ASX Depth/Detail Request.",
            unit_of_count=UnitOfCountType.per_query,
            amount="$0.010",
            frequency="monthly",
            effective_date="1 Jul 2013",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX Time Based Fee - per minute or part thereof.",
            unit_of_count=UnitOfCountType.per_minute,
            amount="$0.060",
            frequency="monthly",
            effective_date="1 Jul 2013",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX Monthly Minimum Fee for Continuous/Single Enquiries.",
            unit_of_count=UnitOfCountType.per_user,
            amount="$1,500",
            minimum_fee="$1,500",
            frequency="monthly",
            effective_date="1 Jul 2018",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX Non-Display Application (revenue generating).",
            unit_of_count=UnitOfCountType.per_application,
            amount="$5,250",
            frequency="monthly",
            effective_date="1 Jan 2026",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX Non-Display Application (non-revenue generating).",
            unit_of_count=UnitOfCountType.per_application,
            amount="$2,625",
            frequency="monthly",
            effective_date="1 Jan 2026",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX Non-Display Reference Venue (Trade Execution Venue).",
            unit_of_count=UnitOfCountType.per_venue,
            amount="$5,250",
            frequency="monthly",
            effective_date="1 Jan 2026",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX Non-Display Enterprise Licence.",
            unit_of_count=UnitOfCountType.enterprise,
            amount="POA",
            frequency="monthly",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX Regulatory Feed (Market Operator).",
            unit_of_count=UnitOfCountType.per_application,
            amount="$0",
            frequency="monthly",
            product_family="MarketSource",
        ),
        # ASX 24 mirrors
        FeeLine(
            description="ASX 24 Professional Enquiry Fee - Continuous real-time for Display.",
            unit_of_count=UnitOfCountType.per_user,
            user_category=UserCategory.professional,
            amount="$142",
            frequency="monthly",
            effective_date="1 Jan 2026",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX 24 Retail Enquiry Fee - Non-professional continuous real-time for Display.",
            unit_of_count=UnitOfCountType.per_user,
            user_category=UserCategory.non_professional,
            amount="$20",
            frequency="monthly",
            effective_date="1 Jul 2014",
            product_family="MarketSource",
        ),
        # Delayed / EOD licences
        FeeLine(
            description="ASX Delayed Data Licence.",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$2,250",
            frequency="monthly",
            effective_date="1 Jan 2026",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX End of Day (EOD) Data Licence.",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$775",
            frequency="monthly",
            effective_date="1 Jan 2026",
            product_family="MarketSource",
        ),
        FeeLine(
            description="ASX Delayed Market Detail Distribution Licence (order book beyond top-of-market).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$7,500",
            frequency="monthly",
            effective_date="1 Jan 2022",
            product_family="MarketSource",
        ),
        FeeLine(
            description="Wallboard / Public Display - delayed ASX or ASX 24 Information.",
            unit_of_count=UnitOfCountType.per_device,
            amount="$80",
            frequency="monthly",
            effective_date="1 Jan 2026",
            product_family="MarketSource",
        ),
    ]

    # --- New Original Works fees ---
    now_fees = [
        FeeLine(
            description="New Original Work Licence Holder.",
            unit_of_count=UnitOfCountType.per_entity,
            amount="Variable",
            frequency="monthly",
            effective_date="1 Jan 2021",
            product_family="MarketSource",
        ),
        FeeLine(
            description="New Original Work Calculator - Real Time.",
            unit_of_count=UnitOfCountType.per_application,
            amount="$5,000",
            frequency="monthly",
            effective_date="1 Jan 2021",
            product_family="MarketSource",
        ),
        FeeLine(
            description="New Original Work Calculator - Delayed.",
            unit_of_count=UnitOfCountType.per_application,
            amount="$4,000",
            frequency="monthly",
            effective_date="1 Jan 2021",
            product_family="MarketSource",
        ),
        FeeLine(
            description="New Original Work Calculator - End of Day.",
            unit_of_count=UnitOfCountType.per_application,
            amount="$3,000",
            frequency="monthly",
            effective_date="1 Jan 2021",
            product_family="MarketSource",
        ),
    ]

    # --- ComNews fees ---
    comnews_fees = [
        FeeLine(
            description="ComNews Continuous Enquiry Fee (up to 150 End Users per firm).",
            unit_of_count=UnitOfCountType.per_user,
            user_category=UserCategory.professional,
            amount="$50",
            frequency="monthly",
            effective_date="1 Jan 2026",
            product_family="ComNews",
        ),
        FeeLine(
            description="ComNews Continuous Enquiry Fee (over 150 End Users per firm).",
            unit_of_count=UnitOfCountType.per_user,
            user_category=UserCategory.professional,
            amount="$50",
            frequency="monthly",
            effective_date="1 Jan 2026",
            product_family="ComNews",
        ),
        FeeLine(
            description="ComNews Non-Professional Continuous Enquiry Fee.",
            unit_of_count=UnitOfCountType.per_user,
            user_category=UserCategory.non_professional,
            amount="$20",
            frequency="monthly",
            effective_date="1 Jan 2023",
            product_family="ComNews",
        ),
        FeeLine(
            description="ComNews Non-Professional per Announcement Fee.",
            unit_of_count=UnitOfCountType.per_query,
            user_category=UserCategory.non_professional,
            amount="$0.30",
            frequency="monthly",
            effective_date="1 Jul 2018",
            product_family="ComNews",
        ),
        FeeLine(
            description="ComNews Monthly Minimum Fee.",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$1,000",
            minimum_fee="$1,000",
            frequency="monthly",
            product_family="ComNews",
        ),
    ]

    # --- ReferencePoint Vendor fees (tiered) ---
    refpoint_fees = [
        FeeLine(
            description="ReferencePoint Master List Display - tiered by Registered Users.",
            unit_of_count=UnitOfCountType.per_entity,
            amount="tiered",
            frequency="monthly",
            product_family="ReferencePoint",
            tier_bands=[
                TierBand(lower_bound=0, upper_bound=5000, amount="$1,315"),
                TierBand(lower_bound=5001, upper_bound=10000, amount="$1,995"),
                TierBand(lower_bound=10001, upper_bound=100000, amount="$2,625"),
                TierBand(lower_bound=100001, upper_bound=None, amount="POA"),
            ],
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="ReferencePoint Master List - Website Display.",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$3,675",
            frequency="monthly",
            product_family="ReferencePoint",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="ReferencePoint Master List - Print Media (circulation up to 500,000).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$760",
            frequency="monthly",
            product_family="ReferencePoint",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="ReferencePoint Master List - Print Media (circulation over 500,000).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$1,500",
            frequency="monthly",
            product_family="ReferencePoint",
            effective_date="1 Jan 2026",
        ),
    ]

    # --- ReferencePoint User fees (participant trade count percentile) ---
    refpoint_user_fees = [
        FeeLine(
            description="Master List & Corp Actions EOD - Participant (trade count percentile up to 50%).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$925",
            frequency="monthly",
            product_family="ReferencePoint",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="Master List & Corp Actions EOD - Participant (trade count percentile 50-85%).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$1,890",
            frequency="monthly",
            product_family="ReferencePoint",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="Master List & Corp Actions EOD - Participant (trade count percentile over 85%).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$2,625",
            frequency="monthly",
            product_family="ReferencePoint",
            effective_date="1 Jan 2026",
        ),
    ]

    # --- Benchmark fees ---
    benchmark_fees = [
        FeeLine(
            description="BBSW Live - single country.",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$564",
            frequency="monthly",
            product_family="Benchmarks",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="BBSW Live - Multi Country 1-6 countries.",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$1,866",
            frequency="monthly",
            product_family="Benchmarks",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="BBSW Live - Multi Country 7+ countries.",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$2,819",
            frequency="monthly",
            product_family="Benchmarks",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="BBSW Total - single country.",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$1,018",
            frequency="monthly",
            product_family="Benchmarks",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="BBSW Live Redistribution Level 1 (up to 9 end user firms).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$1,121",
            frequency="monthly",
            product_family="Benchmarks",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="BBSW Live Redistribution Level 2 (up to 19 end user firms).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$2,801",
            frequency="monthly",
            product_family="Benchmarks",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="BBSW Live Redistribution Level 3 (up to 49 end user firms).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$5,136",
            frequency="monthly",
            product_family="Benchmarks",
            effective_date="1 Jan 2026",
        ),
        FeeLine(
            description="BBSW Live Redistribution Level 4 (50+ end user firms).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="$7,936",
            frequency="monthly",
            product_family="Benchmarks",
            effective_date="1 Jan 2026",
        ),
    ]

    # --- Historical data fees ---
    historical_fees = [
        FeeLine(
            description="Historical Data - Internal Use (per year, one-off).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="varies by dataset",
            frequency="one-off",
            product_family="Historical",
        ),
        FeeLine(
            description="Historical Data - Vendor Publications (per year, one-off, ~40% higher than internal use).",
            unit_of_count=UnitOfCountType.per_entity,
            amount="varies by dataset",
            frequency="one-off",
            product_family="Historical",
        ),
    ]

    all_fee_lines = (
        marketsource_fees + now_fees + comnews_fees
        + refpoint_fees + refpoint_user_fees
        + benchmark_fees + historical_fees
    )

    fee_structure = FeeStructure(
        payment_terms="As specified in ASX General Terms and Conditions.",
        tax="All fees shown excluding GST.",
        unit_of_count="Varies by product: per user, per query, per minute, per application, per venue, per entity, enterprise.",
        fee_lines=all_fee_lines,
        fee_waivers=[
            FeeWaiver(
                description="Delayed Data Licence waived for Participants providing data to Registered Clients via website with login.",
                conditions=["Must be an ASX Participant", "Website must require username and password"],
                applies_to="delayed_data_licence",
            ),
            FeeWaiver(
                description="Monthly Minimum Fee waived for Participants and those paying Direct Access or Delayed Data Licence.",
                conditions=["Must be Participant or hold Direct Access/Delayed Data Licence"],
                applies_to="monthly_minimum",
            ),
            FeeWaiver(
                description="Realised AONIA fees currently waived where subscriber holds BBSW Live or BBSW Total licence.",
                conditions=["Must hold active BBSW Live or BBSW Total subscription"],
                applies_to="realised_aonia",
            ),
            FeeWaiver(
                description="ASX Regulatory Feed at $0 for Market Operators complying with ASIC obligations.",
                conditions=["Must be licensed Market Operator"],
                applies_to="regulatory_feed",
            ),
        ],
    )

    # --- Benchmark licenses ---
    benchmark_licenses = [
        BenchmarkLicense(
            benchmark_name="BBSW Live",
            license_tiers={
                "subscriber_single_country": "$564/month",
                "subscriber_1_6_countries": "$1,866/month",
                "subscriber_7_plus_countries": "$2,819/month",
                "redistribution_level_1_up_to_9_firms": "$1,121/month",
                "redistribution_level_2_up_to_19_firms": "$2,801/month",
                "redistribution_level_3_up_to_49_firms": "$5,136/month",
                "redistribution_level_4_50_plus_firms": "$7,936/month",
                "agency_clearing_house_market_venue": "$3,278/month",
            },
            geographic_scope="Single country, 1-6 countries, 7+ countries",
        ),
        BenchmarkLicense(
            benchmark_name="BBSW Total",
            license_tiers={
                "subscriber_single_country": "$1,018/month",
                "subscriber_1_6_countries": "$2,475/month",
                "subscriber_7_plus_countries": "$3,740/month",
                "agency_clearing_house_market_venue": "$4,675/month",
            },
            geographic_scope="Single country, 1-6 countries, 7+ countries",
        ),
        BenchmarkLicense(
            benchmark_name="Realised AONIA",
            license_tiers={
                "subscriber_single_country": "$282/month",
                "subscriber_1_6_countries": "$933/month",
                "subscriber_7_plus_countries": "$1,410/month",
                "agency_clearing_house_market_venue": "$2,349/month",
            },
            geographic_scope="Single country, 1-6 countries, 7+ countries",
            conditional_waivers=["Currently waived where subscriber holds BBSW Live or BBSW Total licence"],
        ),
    ]

    sections = [
        Section(number=s.number, title=s.title, text=s.text, page=s.page)
        for s in doc.sections
    ]

    return ExchangePolicy(
        exchange="ASX",
        agreement_type=AgreementType.fee_schedule,
        agreement_title="ASX Information and Technical Services Schedule of Fees",
        version="1.1",
        product_families=product_families,
        fee_structure=fee_structure,
        benchmark_licenses=benchmark_licenses,
        sections=sections,
    )
