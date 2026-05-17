"""LSE Market Data Policy Guidelines parser (January 2025)."""

from __future__ import annotations

from ..models.enums import AgreementType, ObligationType, UseClassification, UseContext
from ..models.schema import (
    ComplianceObligation,
    ExchangePolicy,
    Section,
    UsePolicy,
)
from .pdf_extract import ExtractedDocument


def parse_lse_policy_guidelines(doc: ExtractedDocument) -> ExchangePolicy:
    """Parse LSE Market Data Policy Guidelines into ExchangePolicy."""
    definitions = {d.term: d.body for d in doc.definitions}

    use_policies = [
        # --- Redistribution guidance ---
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Core Redistribution Licence: redistribution to Professional Customers, "
                "or both Professional Customers and Private Investors. "
                "Typical use: provision of Real Time Data via display and/or datafeed products."
            ),
            source_section="3.3",
            use_context=UseContext.redistribution,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Private Investor Redistribution Licence: redistribution solely to End Customers "
                "who qualify as Private Investors. "
                "Typical use: provision of Data by retail brokers and specialist Redistributors."
            ),
            source_section="3.3",
            use_context=UseContext.redistribution,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Delayed Data / After Midnight Redistribution Licence: redistribution of Delayed Data "
                "and/or After Midnight Data delivered via controlled mechanisms. "
                "Typical use: website distribution, customer portals, client reports."
            ),
            source_section="3.3",
            use_context=UseContext.website,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Historical Redistribution Licence: redistribution of After Midnight Data "
                "delivered via uncontrolled mechanisms. "
                "Typical use: cloud-based tick service, delivery of After Midnight Data via datafeed."
            ),
            source_section="3.3",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Per Price Request Licence: End Customers actively request individual data points. "
                "Typical use: website portals, display terminals, telephone information services, interactive TV."
            ),
            source_section="3.3",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "TV Ticker Licence: redistribution of individual quotes via TV Devices. "
                "Typical use: news services on TVs."
            ),
            source_section="3.3",
            use_context=UseContext.television,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Enterprise Internal Use for Journalistic Purposes: unlimited users for journalistic activities. "
                "Typical use: use within newsroom for internal users."
            ),
            source_section="3.3",
            use_context=UseContext.internal_use,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Live Ticker for Issuers Licence: listed company provides its own real-time share price. "
                "Typical use: investor relations portals."
            ),
            source_section="3.3",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Investor Relations Licence: delayed provision of up to 4 share prices of LSE-listed companies. "
                "Typical use: investor relations portals."
            ),
            source_section="3.3",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Last Trade Price Licence: redistribution of certain data points on open websites for Private Investors. "
                "Typical use: website distribution."
            ),
            source_section="3.3",
            use_context=UseContext.website,
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Derived Data – Indices/Benchmarks Licence: creation of Indices/Benchmarks as defined "
                "under UK Benchmark Regulations. "
                "Typical use: creation of basket index, used as an underlying for financial instruments."
            ),
            source_section="4.1",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Derived Data (other than Indices/Benchmarks) Licence: creation of Derived Data "
                "which is not Indices/Benchmarks and not an ATP. "
                "Typical uses: risk management applications, indicators/statistics, momentum oscillators, RSI, "
                "moving averages, NAV/iNAV calculation, bespoke/tradeable instruments, VWAP, portfolio management."
            ),
            source_section="4.1",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Derived Data ATP Licence: creation of instruments using Derived Data. "
                "Typical use: creation of CFDs, spread betting instruments, binary options."
            ),
            source_section="4.1",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Raw Data ATP Licence: creation of instruments using raw LSE Data. "
                "Typical use: creation of CFDs, spread betting instruments, binary options."
            ),
            source_section="4.1",
        ),
        UsePolicy(
            classification=UseClassification.conditional,
            description=(
                "Non-Display Usage Licence: trading-based activities only. "
                "Three categories: Principal (own account), Client Facilitation, Trading Platforms (MTFs/SIs). "
                "For hosted environments, the End Customer of the hosted environment requires the licence."
            ),
            conditions=[
                "Principal: internal Non-Display Usage for own-account trading",
                "Client Facilitation: Non-Display Usage to facilitate customer business",
                "Trading Platform: operation of MTFs, systematic internalisers, etc.",
                "Matched principal basis = Client Facilitation licence",
                "Non-matched: both Principal and Client Facilitation categories apply",
                "Examples: automated/semi-automated order generation, order pegging, mid bid/offer pegging, "
                "limit order pegging, price referencing for trading, automated pre-trade risk verification, "
                "smart order routing, arbitrage, order management, execution management, "
                "electronic order flow and liquidity management, market making",
            ],
            source_section="6",
            use_context=UseContext.non_display,
        ),
    ]

    compliance_obligations = [
        ComplianceObligation(
            type=ObligationType.reporting,
            description=(
                "Licensing is technology-agnostic — licence is based on 'what' the Customer does with Data, "
                "not 'how'. Applies equally to traditional setups, cloud-based arrangements, and AI solutions."
            ),
            details=[
                "Licence scope applies regardless of underlying technology",
                "AI-powered solutions using LSE Data require same licences as traditional setups",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.audit,
            description=(
                "Where licensing should have been in place for a prior period, licences are backdated to either "
                "(i) when the Customer commenced the Licensable Activity, or "
                "(ii) when an activity was made a Licensable Activity by the Exchange."
            ),
            details=[
                "Backdating approach ensures level playing field between customers",
                "Audit findings: any licensing that would have been held if compliant is put in place",
                "Audit information is covered by confidentiality provisions in clause 10 of the Terms",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.notice,
            description=(
                "Affiliated entities of the Customer must be considered a 'subsidiary' as defined in "
                "section 1159 of the Companies Act 2006 and must be listed on the Order Form."
            ),
            details=[
                "Exchanges reserve right to approve affiliated entities not meeting strict definition where equivalent control can be evidenced",
                "Jurisdictional reasons may require case-by-case Exchange approval",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.notice,
            description=(
                "Where redistribution of any Delayed Data and/or After Midnight Data occurs under any "
                "Licensable Activity and no commercial benefit is received, the Customer may request a fee waiver."
            ),
            details=[
                "Fee waiver subject to Exchange approval",
            ],
        ),
        ComplianceObligation(
            type=ObligationType.notice,
            description=(
                "Service Facilitation: Redistribution Service Facilitators enable licensed Redistributors "
                "to extend distribution channels to End Customers, whether through technical or commercial arrangements."
            ),
            details=[
                "Redistributor-branded solution: no additional charge",
                "Partner-branded or co-branded solution ('vendor of record'): Service Facilitator Licence Charges apply",
                "Software developer with no external clients: no additional charge",
                "Sales agent with no direct external clients: no additional charge",
                "Derived Data White Label: additional annual fee, must be listed on licence application",
            ],
        ),
    ]

    sections = [
        Section(number=s.number, title=s.title, text=s.text, page=s.page)
        for s in doc.sections
    ]

    return ExchangePolicy(
        exchange="LSE",
        agreement_type=AgreementType.policy_guidelines,
        agreement_title="London Stock Exchange Market Data Policy Guidelines",
        version="January 2025",
        definitions=definitions,
        use_policies=use_policies,
        compliance_obligations=compliance_obligations,
        sections=sections,
    )
