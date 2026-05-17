"""LSE Schedule A – Price List and Data Products parser (January 2025)."""

from __future__ import annotations

from ..models.enums import AgreementType, UnitOfCountType, UserCategory
from ..models.schema import (
    ExchangePolicy,
    FeeLine,
    FeeStructure,
    FeeWaiver,
    Section,
    TierBand,
)
from .pdf_extract import ExtractedDocument


def parse_lse_schedule_a(doc: ExtractedDocument) -> ExchangePolicy:
    """Parse LSE Schedule A – Price List and Data Products into ExchangePolicy."""
    definitions = {d.term: d.body for d in doc.definitions}

    fee_lines = [
        # --- Real-time redistribution licences ---
        FeeLine(
            description="UK market Data – Level 2 Real-Time Redistribution (Professional Users)",
            unit_of_count=UnitOfCountType.enterprise,
            user_category=UserCategory.professional,
            amount="£64,391",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data – Level 1 Real-Time Redistribution (Professional Users)",
            unit_of_count=UnitOfCountType.enterprise,
            user_category=UserCategory.professional,
            amount="£35,317",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data – Post-trade Real-Time Redistribution (Professional Users)",
            unit_of_count=UnitOfCountType.enterprise,
            user_category=UserCategory.professional,
            amount="£27,021",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data – Level 2 Real-Time Redistribution (Private Investors)",
            unit_of_count=UnitOfCountType.enterprise,
            user_category=UserCategory.non_professional,
            amount="£12,872",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data – Level 1 Real-Time Redistribution (Private Investors)",
            unit_of_count=UnitOfCountType.enterprise,
            user_category=UserCategory.non_professional,
            amount="£7,976",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data – ETF/ETP Level 2 Real-Time Redistribution",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£26,725",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data – AIM Level 2 Real-Time Redistribution",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£26,725",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="International market Data – Level 2 Real-Time Redistribution (Professional Users)",
            unit_of_count=UnitOfCountType.enterprise,
            user_category=UserCategory.professional,
            amount="£32,532",
            currency="GBP",
            frequency="annual",
            product_family="International Market Data",
        ),
        FeeLine(
            description="International market Data – Level 1 Real-Time Redistribution (Professional Users)",
            unit_of_count=UnitOfCountType.enterprise,
            user_category=UserCategory.professional,
            amount="£17,722",
            currency="GBP",
            frequency="annual",
            product_family="International Market Data",
        ),
        FeeLine(
            description="Turquoise market Data – Level 2 Real-Time Redistribution",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£34,520",
            currency="GBP",
            frequency="annual",
            product_family="Turquoise Market Data",
        ),
        FeeLine(
            description="Turquoise market Data – Level 1 Real-Time Redistribution",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£13,809",
            currency="GBP",
            frequency="annual",
            product_family="Turquoise Market Data",
        ),
        # --- Delayed / After Midnight redistribution ---
        FeeLine(
            description="UK market Data – Level 2 Delayed Redistribution (per Website)",
            unit_of_count=UnitOfCountType.per_venue,
            amount="£12,777",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data – Level 2 Delayed Redistribution (Enterprise)",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£154,350",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data – Level 1 Delayed Redistribution (per Website)",
            unit_of_count=UnitOfCountType.per_venue,
            amount="£5,661",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data – Level 2 After Midnight Redistribution",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£12,777",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        # --- Historical Redistribution ---
        FeeLine(
            description="UK and International market Data – Historical Redistribution (1–10 End Customers)",
            unit_of_count=UnitOfCountType.per_entity,
            amount="£12,278",
            currency="GBP",
            frequency="annual",
            tier_bands=[
                TierBand(lower_bound=1, upper_bound=10, amount="£12,278"),
                TierBand(lower_bound=11, upper_bound=50, amount="£25,555"),
                TierBand(lower_bound=51, upper_bound=None, amount="£51,110"),
            ],
            product_family="UK Market Data",
        ),
        # --- Other redistribution licences ---
        FeeLine(
            description="Per Price Request Licence – UK and International market Data",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£5,535",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="TV Ticker Licence – UK and International market Data",
            unit_of_count=UnitOfCountType.per_entity,
            amount="£5,661",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Enterprise Internal Use for Journalistic Purposes – UK and International market Data",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£378,000",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Live Ticker for Issuers Licence",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£5,661",
            currency="GBP",
            frequency="annual",
        ),
        FeeLine(
            description="Investor Relations Licence (per Website)",
            unit_of_count=UnitOfCountType.per_venue,
            amount="£593",
            currency="GBP",
            frequency="annual",
        ),
        FeeLine(
            description="Last Trade Price Licence – UK and International market Data (per Website)",
            unit_of_count=UnitOfCountType.per_venue,
            amount="£101,706",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Last Trade Price Licence – UK and International market Data (Enterprise)",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£441,000",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        # --- Derived Data licences ---
        FeeLine(
            description="Indices/Benchmarks Licence – UK market Data (1–10 End Customers)",
            unit_of_count=UnitOfCountType.per_entity,
            amount="£11,863",
            currency="GBP",
            frequency="annual",
            tier_bands=[
                TierBand(lower_bound=1, upper_bound=10, amount="£11,863"),
                TierBand(lower_bound=11, upper_bound=50, amount="£18,696"),
                TierBand(lower_bound=51, upper_bound=100, amount="£24,924"),
                TierBand(lower_bound=101, upper_bound=250, amount="£37,380"),
                TierBand(lower_bound=251, upper_bound=400, amount="£56,075"),
                TierBand(lower_bound=401, upper_bound=700, amount="£93,444"),
                TierBand(lower_bound=701, upper_bound=None, amount="£124,596"),
            ],
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Derived Data other than Indices/Benchmarks – UK market Data (1–10 End Customers)",
            unit_of_count=UnitOfCountType.per_entity,
            amount="£6,075",
            currency="GBP",
            frequency="annual",
            tier_bands=[
                TierBand(lower_bound=1, upper_bound=10, amount="£6,075"),
                TierBand(lower_bound=11, upper_bound=50, amount="£12,781"),
                TierBand(lower_bound=51, upper_bound=250, amount="£38,318"),
                TierBand(lower_bound=251, upper_bound=None, amount="£63,855"),
            ],
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Raw Data ATP – UK market Data Level 2",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£87,655",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Raw Data ATP – UK market Data Level 1",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£35,053",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Derived Data ATP – UK market Data Level 2 (Base Fee, up to 500 Natural Users)",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£87,655",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Derived Data ATP White Label Licence (all market Data)",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£6,518",
            currency="GBP",
            frequency="annual",
        ),
        # --- Non-Display Usage Licence Charges ---
        FeeLine(
            description="Non-Display (Trading as Principal) – UK market Data Level 2 (1–5 entitlements)",
            unit_of_count=UnitOfCountType.per_application,
            amount="£40,000",
            currency="GBP",
            frequency="annual",
            tier_bands=[
                TierBand(lower_bound=1, upper_bound=5, amount="£40,000"),
                TierBand(lower_bound=6, upper_bound=10, amount="£45,000"),
                TierBand(lower_bound=11, upper_bound=30, amount="£50,000"),
                TierBand(lower_bound=31, upper_bound=None, amount="£60,000"),
            ],
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Non-Display (Client Facilitation) – UK market Data Level 2 (1–5 entitlements)",
            unit_of_count=UnitOfCountType.per_application,
            amount="£40,000",
            currency="GBP",
            frequency="annual",
            tier_bands=[
                TierBand(lower_bound=1, upper_bound=5, amount="£40,000"),
                TierBand(lower_bound=6, upper_bound=10, amount="£45,000"),
                TierBand(lower_bound=11, upper_bound=30, amount="£50,000"),
                TierBand(lower_bound=31, upper_bound=None, amount="£60,000"),
            ],
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Non-Display (Trading Platform/MTF) – UK market Data Level 2",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£80,333",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="Non-Display (Trading Platform/MTF) – UK market Data Level 1",
            unit_of_count=UnitOfCountType.enterprise,
            amount="£33,661",
            currency="GBP",
            frequency="annual",
            product_family="UK Market Data",
        ),
        # --- Other Application Usage ---
        FeeLine(
            description="Other Application Usage – UK market Data Level 2 (1–3 entitlements)",
            unit_of_count=UnitOfCountType.per_application,
            amount="£8,317",
            currency="GBP",
            frequency="annual",
            tier_bands=[
                TierBand(lower_bound=1, upper_bound=3, amount="£8,317"),
                TierBand(lower_bound=4, upper_bound=6, amount="£14,966"),
                TierBand(lower_bound=7, upper_bound=10, amount="£23,943"),
                TierBand(lower_bound=11, upper_bound=None, amount="£38,416"),
            ],
            product_family="UK Market Data",
        ),
        # --- Data Charges (monthly, per Device) ---
        FeeLine(
            description="UK market Data Level 2 Data Charge – Non-Member (per month, per Device)",
            unit_of_count=UnitOfCountType.per_device,
            user_category=UserCategory.professional,
            amount="£180.40",
            currency="GBP",
            frequency="monthly",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data Level 1 Data Charge – Non-Member (per month, per Device)",
            unit_of_count=UnitOfCountType.per_device,
            user_category=UserCategory.professional,
            amount="£51.10",
            currency="GBP",
            frequency="monthly",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data Level 2 Data Charge – Member (per month, per Device)",
            unit_of_count=UnitOfCountType.per_device,
            user_category=UserCategory.professional,
            amount="£174.93",
            currency="GBP",
            frequency="monthly",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="UK market Data Level 1 Data Charge – Member (per month, per Device)",
            unit_of_count=UnitOfCountType.per_device,
            user_category=UserCategory.professional,
            amount="£48.53",
            currency="GBP",
            frequency="monthly",
            product_family="UK Market Data",
        ),
        FeeLine(
            description="International market Data Level 2 Data Charge – Non-Member (per month, per Device)",
            unit_of_count=UnitOfCountType.per_device,
            user_category=UserCategory.professional,
            amount="£97.90",
            currency="GBP",
            frequency="monthly",
            product_family="International Market Data",
        ),
        FeeLine(
            description="International market Data Level 1 Data Charge – Non-Member (per month, per Device)",
            unit_of_count=UnitOfCountType.per_device,
            user_category=UserCategory.professional,
            amount="£28.07",
            currency="GBP",
            frequency="monthly",
            product_family="International Market Data",
        ),
        FeeLine(
            description="Turquoise market Data Level 2 Data Charge (per month, per Device)",
            unit_of_count=UnitOfCountType.per_device,
            amount="£15.91",
            currency="GBP",
            frequency="monthly",
            product_family="Turquoise Market Data",
        ),
        FeeLine(
            description="Turquoise market Data Level 1 Data Charge (per month, per Device)",
            unit_of_count=UnitOfCountType.per_device,
            amount="£7.95",
            currency="GBP",
            frequency="monthly",
            product_family="Turquoise Market Data",
        ),
        # --- Per Price Request Data Charges ---
        FeeLine(
            description="Per Price Request Data Charge (300,001–4,000,000 requests)",
            unit_of_count=UnitOfCountType.per_query,
            amount="£0.015 per request",
            currency="GBP",
            frequency="monthly",
        ),
        FeeLine(
            description="Per Price Request Data Charge (4,000,001+ requests)",
            unit_of_count=UnitOfCountType.per_query,
            amount="£0.008 per request",
            currency="GBP",
            frequency="monthly",
        ),
    ]

    fee_waivers = [
        FeeWaiver(
            description="Order Book for Retail Bonds – Redistribution Licence Charges",
            applies_to="Order Book for Retail Bonds",
        ),
        FeeWaiver(
            description="TRADEcho – Redistribution Licence Charges",
            applies_to="TRADEcho",
        ),
        FeeWaiver(
            description="Turquoise market Data – Private Investor Real-Time Redistribution Licence",
            conditions=["Fee waived until 31st December 2025"],
            applies_to="Turquoise market Data",
        ),
        FeeWaiver(
            description="Turquoise market Data – Level 1 Private Investor Redistribution Licence",
            conditions=["Fee waived until 31st December 2026"],
            applies_to="Turquoise market Data",
        ),
        FeeWaiver(
            description="Turquoise Europe market Data – Delayed and After Midnight Redistribution",
            conditions=["Fee waived where no commercial benefit is received from redistribution"],
            applies_to="Turquoise Europe market Data",
        ),
        FeeWaiver(
            description="Private Investor Data Charges – UK, International, Turquoise market Data",
            applies_to="All data products (Private Investor End Customers)",
        ),
        FeeWaiver(
            description="Turquoise market Data – Other Application Usage Licence",
            applies_to="Turquoise market Data, Turquoise Europe market Data",
        ),
        FeeWaiver(
            description="Retail Broker Order Book Trading Scheme – Private Investor Real-Time Redistribution",
            conditions=["Eligible participants of the Retail Broker Order Book Trading Scheme only"],
            applies_to="UK market Data Private Investor Level 2",
        ),
        FeeWaiver(
            description="New Customer Non-Display Usage – 50% discount for first 12 calendar months",
            conditions=[
                "Customer must not have existing or prior Non-Display Usage licence",
                "Applies from Commencement Date of Order Form",
            ],
            applies_to="All Non-Display Usage Licences",
        ),
        FeeWaiver(
            description="Member Firms – 12% discount on Level 2 Non-Display Usage Charges",
            applies_to="UK market Data and International market Data Level 2 Non-Display Usage",
        ),
    ]

    fee_structure = FeeStructure(
        payment_terms=(
            "Licence Charges: annual, invoiced annually in advance (pro-rated monthly for Initial Term). "
            "Data Charges: monthly, invoiced monthly in arrears."
        ),
        late_penalty="Bank of England base rate plus 8% per annum, accrued daily on overdue amounts.",
        escalation="Exchanges reserve the right to amend Charges at their sole discretion in accordance with the Terms.",
        tax="All Charges exclude VAT. Customer responsible for all applicable taxes.",
        unit_of_count=(
            "Charges apply per Customer, per Unit of Count, per Data Product, on a cumulative basis. "
            "Units of count include: per Device (display), per application (non-display), "
            "per End Customer (derived data / historical redistribution), per Website (delayed/per price request), enterprise."
        ),
        reporting_requirements=(
            "Data Charges reported in accordance with Reporting and Audit Schedule (Schedule C). "
            "Member locations must be pre-registered 21 days in advance."
        ),
        fee_lines=fee_lines,
        fee_waivers=fee_waivers,
    )

    sections = [
        Section(number=s.number, title=s.title, text=s.text, page=s.page)
        for s in doc.sections
    ]

    return ExchangePolicy(
        exchange="LSE",
        agreement_type=AgreementType.fee_schedule,
        agreement_title="Schedule A – Price List and Data Products",
        version="January 2025",
        definitions=definitions,
        fee_structure=fee_structure,
        sections=sections,
    )
