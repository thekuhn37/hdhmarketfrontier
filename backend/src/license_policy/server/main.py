"""FastMCP server for financial exchange license policy data."""

from __future__ import annotations

import json
from pathlib import Path

from mcp.server.fastmcp import FastMCP

from license_policy.server.data_store import PolicyStore

# Resolve data directory relative to project root
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_DATA_DIR = _PROJECT_ROOT / "data" / "processed"

mcp = FastMCP("license-policy")
store = PolicyStore(_DATA_DIR if _DATA_DIR.exists() else None)


# --- Resources ---


@mcp.resource("policy://exchanges")
def list_exchanges() -> str:
    """List available exchanges, their agreement types, and product families."""
    return json.dumps(store.list_exchanges(), indent=2)


@mcp.resource("policy://{exchange}/summary")
def exchange_summary(exchange: str) -> str:
    """High-level policy summary for an exchange."""
    policies = store.get_policy(exchange)
    if not policies:
        return json.dumps({"error": f"No policies found for {exchange}"})
    summaries = []
    for p in policies:
        summaries.append({
            "exchange": p.exchange,
            "agreement_type": p.agreement_type.value,
            "agreement_title": p.agreement_title,
            "version": p.version,
            "license_scope": p.license_scope.description if p.license_scope else "",
            "num_use_policies": len(p.use_policies),
            "num_obligations": len(p.compliance_obligations),
            "num_termination_provisions": len(p.termination_provisions),
            "num_product_families": len(p.product_families),
            "num_fee_lines": len(p.fee_structure.fee_lines) if p.fee_structure else 0,
            "num_benchmark_licenses": len(p.benchmark_licenses),
        })
    return json.dumps(summaries, indent=2)


@mcp.resource("policy://{exchange}/product-families")
def product_families(exchange: str) -> str:
    """Product families and their data categories for an exchange."""
    results = store.get_product_families(exchange)
    return json.dumps(results, indent=2)


@mcp.resource("policy://{exchange}/data-categories")
def data_categories(exchange: str) -> str:
    """Data category definitions for an exchange."""
    results = []
    for p in store.get_policy(exchange):
        for dc in p.data_categories:
            entry = {
                "agreement_type": p.agreement_type.value,
                "category": dc.category.value,
                "description": dc.description,
                "timing_constraint": dc.timing_constraint,
            }
            if dc.delay_period:
                entry["delay_period"] = dc.delay_period
            results.append(entry)
    return json.dumps(results, indent=2)


@mcp.resource("policy://{exchange}/use-policies")
def use_policies(exchange: str) -> str:
    """Permitted/prohibited uses for an exchange, including use context."""
    results = []
    for p in store.get_policy(exchange):
        for up in p.use_policies:
            entry = {
                "agreement_type": p.agreement_type.value,
                "classification": up.classification.value,
                "description": up.description,
                "conditions": up.conditions,
                "source_section": up.source_section,
            }
            if up.use_context:
                entry["use_context"] = up.use_context.value
            if up.applicable_user_categories:
                entry["user_categories"] = [uc.value for uc in up.applicable_user_categories]
            if up.applicable_product_families:
                entry["product_families"] = up.applicable_product_families
            results.append(entry)
    return json.dumps(results, indent=2)


@mcp.resource("policy://{exchange}/fees")
def fees(exchange: str) -> str:
    """Fee structure for an exchange."""
    results = []
    for p in store.get_policy(exchange):
        if p.fee_structure:
            entry = {
                "agreement_type": p.agreement_type.value,
                "payment_terms": p.fee_structure.payment_terms,
                "late_penalty": p.fee_structure.late_penalty,
                "tax": p.fee_structure.tax,
                "num_fee_lines": len(p.fee_structure.fee_lines),
                "num_waivers": len(p.fee_structure.fee_waivers),
            }
            if p.fee_structure.unit_of_count:
                entry["unit_of_count"] = p.fee_structure.unit_of_count
            results.append(entry)
    return json.dumps(results, indent=2)


@mcp.resource("policy://{exchange}/fees/{product_family}")
def fees_by_product_family(exchange: str, product_family: str) -> str:
    """Fees for a specific product family."""
    results = store.get_fees(exchange, product_family=product_family)
    return json.dumps(results, indent=2)


@mcp.resource("policy://{exchange}/compliance")
def compliance(exchange: str) -> str:
    """Compliance obligations for an exchange."""
    return json.dumps(store.get_obligations(exchange), indent=2)


@mcp.resource("policy://{exchange}/termination")
def termination(exchange: str) -> str:
    """Termination and wind-down provisions for an exchange."""
    results = []
    for p in store.get_policy(exchange):
        entry: dict = {
            "agreement_type": p.agreement_type.value,
            "provisions": [tp.model_dump() for tp in p.termination_provisions],
        }
        if p.wind_down:
            entry["wind_down"] = p.wind_down.model_dump()
        results.append(entry)
    return json.dumps(results, indent=2)


@mcp.resource("policy://{exchange}/attribution")
def attribution(exchange: str) -> str:
    """Attribution/display requirements for an exchange."""
    results = []
    for p in store.get_policy(exchange):
        for ar in p.attribution_requirements:
            results.append({
                "agreement_type": p.agreement_type.value,
                **ar.model_dump(),
            })
    return json.dumps(results, indent=2)


@mcp.resource("policy://{exchange}/liability")
def liability(exchange: str) -> str:
    """Liability caps and indemnification for an exchange."""
    results = []
    for p in store.get_policy(exchange):
        if p.liability:
            results.append({
                "agreement_type": p.agreement_type.value,
                **p.liability.model_dump(),
            })
    return json.dumps(results, indent=2)


@mcp.resource("policy://{exchange}/benchmarks")
def benchmarks(exchange: str) -> str:
    """Benchmark licensing tiers for an exchange."""
    results = store.get_benchmarks(exchange)
    return json.dumps(results, indent=2)


@mcp.resource("policy://{exchange}/section/{number}")
def section_text(exchange: str, number: str) -> str:
    """Raw section text by number."""
    return json.dumps(store.get_section_text(exchange, number), indent=2)


@mcp.resource("policy://{exchange}/full")
def full_policy(exchange: str) -> str:
    """Complete policy JSON for an exchange."""
    policies = store.get_policy(exchange)
    return json.dumps([p.model_dump() for p in policies], indent=2, default=str)


# --- Tools ---


@mcp.tool()
def check_use_permitted(
    exchange: str,
    use_description: str,
    use_context: str | None = None,
    user_category: str | None = None,
    agreement: str | None = None,
) -> str:
    """Check if a specific use of exchange data is permitted, prohibited, or conditional.

    Args:
        exchange: Exchange name (e.g., "CME", "ASX")
        use_description: Description of intended use (e.g., "create CFDs", "display on website")
        use_context: Optional context filter (display, non_display, datafeed, new_original_work, etc.)
        user_category: Optional user category filter (professional, non_professional, academic)
        agreement: Optional agreement type filter
    """
    results = store.check_use(exchange, use_description, agreement)
    # Filter by use_context if specified
    if use_context:
        results = [r for r in results if r.get("use_context") == use_context]
    # Filter by user_category if specified
    if user_category:
        results = [
            r for r in results
            if not r.get("user_categories") or user_category in r.get("user_categories", [])
        ]
    if not results:
        return json.dumps({
            "message": f"No specific policy found matching '{use_description}' for {exchange}. Review full use policies for complete guidance.",
            "suggestion": f"Try: policy://{exchange.lower()}/use-policies",
        })
    return json.dumps(results, indent=2)


@mcp.tool()
def get_transformation_requirements(exchange: str) -> str:
    """Get derived data transformation rules for an exchange.

    Args:
        exchange: Exchange name (e.g., "CME", "ASX")
    """
    results = []
    for p in store.get_policy(exchange):
        for tr in p.transformation_requirements:
            results.append({
                "agreement_type": p.agreement_type.value,
                "description": tr.description,
                "criteria": tr.criteria,
                "verification_authority": tr.verification_authority,
            })
        for now in p.new_original_works:
            results.append({
                "agreement_type": p.agreement_type.value,
                "type": "new_original_work",
                "description": now.description,
                "qualification_criteria": now.qualification_criteria,
                "requires_separate_agreement": now.requires_separate_agreement,
                "calculator_fees": now.calculator_fees,
            })
    return json.dumps(results, indent=2) if results else json.dumps({"message": "No transformation requirements found."})


@mcp.tool()
def get_compliance_obligations(exchange: str, obligation_type: str | None = None, agreement: str | None = None) -> str:
    """Get compliance obligations, optionally filtered by type.

    Args:
        exchange: Exchange name (e.g., "CME", "ASX")
        obligation_type: Optional filter (audit, record_keeping, disclaimer, attribution, access_entitlement_system, etc.)
        agreement: Optional agreement type filter
    """
    results = store.get_obligations(exchange, obligation_type, agreement)
    return json.dumps(results, indent=2)


@mcp.tool()
def get_attribution_requirements(exchange: str, agreement: str | None = None) -> str:
    """Get display/attribution requirements for an exchange.

    Args:
        exchange: Exchange name (e.g., "CME", "ASX")
        agreement: Optional agreement type filter
    """
    results = []
    for p in store.get_policy(exchange, agreement):
        for ar in p.attribution_requirements:
            results.append({
                "agreement_type": p.agreement_type.value,
                **ar.model_dump(),
            })
    return json.dumps(results, indent=2) if results else json.dumps({"message": "No attribution requirements found."})


@mcp.tool()
def get_fee_for_use(
    exchange: str,
    use_context: str,
    user_category: str | None = None,
    unit_of_count: str | None = None,
    product_family: str | None = None,
) -> str:
    """Look up applicable fees for a specific use case.

    Args:
        exchange: Exchange name (e.g., "CME", "ASX")
        use_context: Use context (display, non_display, datafeed, new_original_work, etc.)
        user_category: Optional user category (professional, non_professional, academic)
        unit_of_count: Optional unit of count filter (per_user, per_query, per_minute, etc.)
        product_family: Optional product family filter (MarketSource, ComNews, ReferencePoint, etc.)
    """
    all_fees = store.get_fees(exchange, product_family=product_family)
    # Filter by use context keywords in description
    context_lower = use_context.lower().replace("_", " ")
    results = []
    for fee in all_fees:
        desc_lower = fee["description"].lower()
        match = False
        if context_lower in desc_lower:
            match = True
        elif use_context == "display" and ("enquiry" in desc_lower or "display" in desc_lower):
            match = True
        elif use_context == "non_display" and "non-display" in desc_lower:
            match = True
        if not match:
            continue
        if user_category and fee.get("user_category") and fee["user_category"] != user_category:
            continue
        if unit_of_count and fee.get("unit_of_count") and fee["unit_of_count"] != unit_of_count:
            continue
        results.append(fee)
    if not results:
        return json.dumps({
            "message": f"No fees found for use_context='{use_context}' on {exchange}.",
            "suggestion": f"Try: policy://{exchange.lower()}/fees",
        })
    return json.dumps(results, indent=2)


@mcp.tool()
def get_unit_of_count(exchange: str, use_context: str, product_family: str | None = None) -> str:
    """Determine which unit of count applies to a use case.

    Args:
        exchange: Exchange name (e.g., "CME", "ASX")
        use_context: Use context (display, non_display, datafeed, etc.)
        product_family: Optional product family filter
    """
    fees = store.get_fees(exchange, product_family=product_family)
    context_lower = use_context.lower().replace("_", " ")
    units = set()
    details = []
    for fee in fees:
        desc_lower = fee["description"].lower()
        if context_lower in desc_lower or (
            use_context == "display" and ("enquiry" in desc_lower or "display" in desc_lower)
        ) or (
            use_context == "non_display" and "non-display" in desc_lower
        ):
            uoc = fee.get("unit_of_count", "unknown")
            units.add(uoc)
            details.append({
                "unit_of_count": uoc,
                "description": fee["description"],
                "amount": fee["amount"],
            })
    if not details:
        return json.dumps({"message": f"No unit of count found for '{use_context}' on {exchange}."})
    return json.dumps({"applicable_units": sorted(units), "details": details}, indent=2)


@mcp.tool()
def compare_exchanges(dimension: str, exchanges: list[str] | None = None) -> str:
    """Compare a specific dimension across exchanges.

    Args:
        dimension: What to compare (e.g., "fees", "termination", "audit", "liability", "use_policies", "attribution", "benchmarks")
        exchanges: Optional list of exchanges to compare. Defaults to all.
    """
    all_exchanges = store.list_exchanges()
    target_exchanges = exchanges or list(all_exchanges.keys())

    results = {}
    for ex in target_exchanges:
        ex_lower = ex.lower()
        if ex_lower not in all_exchanges:
            results[ex] = {"error": "Exchange not found"}
            continue

        policies = store.get_policy(ex)
        ex_data = {}
        for p in policies:
            at = p.agreement_type.value
            if dimension == "fees" and p.fee_structure:
                ex_data[at] = {
                    "payment_terms": p.fee_structure.payment_terms,
                    "num_fee_lines": len(p.fee_structure.fee_lines),
                    "num_waivers": len(p.fee_structure.fee_waivers),
                }
            elif dimension == "termination":
                ex_data[at] = [tp.model_dump() for tp in p.termination_provisions]
            elif dimension == "audit":
                ex_data[at] = [
                    ob.model_dump() for ob in p.compliance_obligations if ob.type.value == "audit"
                ]
            elif dimension == "liability" and p.liability:
                ex_data[at] = p.liability.model_dump()
            elif dimension == "use_policies":
                ex_data[at] = [up.model_dump() for up in p.use_policies]
            elif dimension == "attribution":
                ex_data[at] = [ar.model_dump() for ar in p.attribution_requirements]
            elif dimension == "benchmarks":
                ex_data[at] = [bl.model_dump() for bl in p.benchmark_licenses]
        results[ex] = ex_data

    return json.dumps(results, indent=2, default=str)


@mcp.tool()
def search_policy(query: str, exchange: str | None = None, agreement: str | None = None) -> str:
    """Full-text search across policy sections.

    Args:
        query: Search query
        exchange: Optional exchange filter
        agreement: Optional agreement type filter
    """
    results = store.search_policies(query, exchange, agreement)
    return json.dumps(results[:20], indent=2)


# --- Prompts ---


@mcp.prompt()
def analyze_use_case(exchange: str, product_description: str) -> str:
    """Analyze whether a product complies with the exchange license.

    Args:
        exchange: Exchange name (e.g., "CME", "ASX")
        product_description: Description of the product or use case to analyze
    """
    policies = store.get_policy(exchange)
    if not policies:
        return f"No policies found for exchange: {exchange}"

    policy_context = []
    for p in policies:
        policy_context.append(f"## {p.agreement_title} ({p.agreement_type.value})")
        if p.license_scope:
            policy_context.append(f"License scope: {p.license_scope.description}")
        if p.product_families:
            policy_context.append("### Product families:")
            for pf in p.product_families:
                policy_context.append(f"- **{pf.name}**: {pf.description}")
        policy_context.append("### Use policies:")
        for up in p.use_policies:
            ctx = f" [{up.use_context.value}]" if up.use_context else ""
            policy_context.append(f"- [{up.classification.value.upper()}]{ctx} {up.description}")
            if up.conditions:
                for c in up.conditions:
                    policy_context.append(f"  - Condition: {c}")
        if p.transformation_requirements:
            policy_context.append("### Transformation requirements:")
            for tr in p.transformation_requirements:
                policy_context.append(f"- {tr.description}")
                for c in tr.criteria:
                    policy_context.append(f"  - {c}")
        if p.new_original_works:
            policy_context.append("### New Original Works:")
            for now in p.new_original_works:
                policy_context.append(f"- {now.description}")

    context = "\n".join(policy_context)
    return (
        f"Analyze whether the following product/use case complies with {exchange} license policies.\n\n"
        f"**Product/Use Case:** {product_description}\n\n"
        f"**Policy Context:**\n{context}\n\n"
        "Please determine:\n"
        "1. Is this use permitted, prohibited, or conditional under each applicable agreement?\n"
        "2. What conditions or requirements must be met?\n"
        "3. Are there any risks or areas of ambiguity?\n"
        "4. What specific sections should be reviewed with legal counsel?"
    )


@mcp.prompt()
def compliance_checklist(exchange: str, agreement: str | None = None) -> str:
    """Generate a compliance checklist for an exchange.

    Args:
        exchange: Exchange name (e.g., "CME", "ASX")
        agreement: Optional agreement type filter
    """
    obligations = store.get_obligations(exchange, agreement=agreement)
    if not obligations:
        return f"No compliance obligations found for {exchange}."

    items = []
    for ob in obligations:
        items.append(f"- [ ] **{ob['type']}** ({ob['agreement_type']}): {ob['description']}")
        if ob.get("duration"):
            items.append(f"  - Duration: {ob['duration']}")
        for d in ob.get("details", []):
            items.append(f"  - {d}")

    checklist = "\n".join(items)
    return (
        f"Review and complete the following compliance checklist for {exchange}.\n\n"
        f"{checklist}\n\n"
        "For each item, confirm whether your organization is currently in compliance, "
        "identify any gaps, and note any remediation steps needed."
    )


def main() -> None:
    mcp.run()
