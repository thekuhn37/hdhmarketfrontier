"""Loads processed JSON and provides query methods."""

from __future__ import annotations

import json
from pathlib import Path

from license_policy.models.schema import ExchangePolicy


class PolicyStore:
    """In-memory store for exchange policies, indexed by (exchange, agreement_type)."""

    def __init__(self, data_dir: str | Path | None = None) -> None:
        self._policies: dict[tuple[str, str], ExchangePolicy] = {}
        if data_dir:
            self.load_dir(data_dir)

    def load_dir(self, data_dir: str | Path) -> None:
        data_path = Path(data_dir)
        for json_file in sorted(data_path.glob("*.json")):
            self.load_file(json_file)

    def load_file(self, path: str | Path) -> None:
        path = Path(path)
        raw = json.loads(path.read_text())
        policy = ExchangePolicy.model_validate(raw)
        key = (policy.exchange.lower(), policy.agreement_type.value)
        if key in self._policies:
            self._merge(self._policies[key], policy)
        else:
            self._policies[key] = policy

    @staticmethod
    def _merge(base: ExchangePolicy, incoming: ExchangePolicy) -> None:
        """Merge sections and use_policies from incoming into base (in-place)."""
        existing_sections = {(s.number, s.title) for s in base.sections}
        for s in incoming.sections:
            if (s.number, s.title) not in existing_sections:
                base.sections.append(s)
                existing_sections.add((s.number, s.title))

        existing_ups = {up.description for up in base.use_policies}
        for up in incoming.use_policies:
            if up.description not in existing_ups:
                base.use_policies.append(up)
                existing_ups.add(up.description)

    def list_exchanges(self) -> dict[str, dict]:
        """Return {exchange: {agreement_types: [...], product_families: [...]}}."""
        result: dict[str, dict] = {}
        for (exchange, agreement_type), policy in self._policies.items():
            if exchange not in result:
                result[exchange] = {"agreement_types": [], "product_families": []}
            result[exchange]["agreement_types"].append(agreement_type)
            for pf in policy.product_families:
                if pf.name not in result[exchange]["product_families"]:
                    result[exchange]["product_families"].append(pf.name)
        return result

    def list_agreements(self, exchange: str) -> list[str]:
        exchange_lower = exchange.lower()
        return [at for ex, at in self._policies if ex == exchange_lower]

    def get_policy(self, exchange: str, agreement: str | None = None) -> list[ExchangePolicy]:
        exchange_lower = exchange.lower()
        results = []
        for (ex, at), policy in self._policies.items():
            if ex == exchange_lower:
                if agreement is None or at == agreement:
                    results.append(policy)
        return results

    def get_product_families(self, exchange: str) -> list[dict]:
        """Return product families for an exchange across all agreements."""
        results = []
        seen = set()
        for policy in self.get_policy(exchange):
            for pf in policy.product_families:
                if pf.name not in seen:
                    seen.add(pf.name)
                    results.append({
                        "name": pf.name,
                        "description": pf.description,
                        "data_categories": [dc.value for dc in pf.data_categories],
                        "use_contexts": [uc.value for uc in pf.use_contexts],
                    })
        return results

    def check_use(self, exchange: str, use_description: str, agreement: str | None = None) -> list[dict]:
        """Check if a use is permitted/prohibited/conditional across matching policies."""
        results = []
        query_lower = use_description.lower()
        for policy in self.get_policy(exchange, agreement):
            for up in policy.use_policies:
                desc_lower = up.description.lower()
                # Simple keyword matching
                query_words = query_lower.split()
                if any(word in desc_lower for word in query_words if len(word) > 2):
                    result = {
                        "agreement_type": policy.agreement_type.value,
                        "classification": up.classification.value,
                        "description": up.description,
                        "conditions": up.conditions,
                        "source_section": up.source_section,
                    }
                    if up.use_context:
                        result["use_context"] = up.use_context.value
                    if up.applicable_user_categories:
                        result["user_categories"] = [uc.value for uc in up.applicable_user_categories]
                    if up.applicable_product_families:
                        result["product_families"] = up.applicable_product_families
                    results.append(result)
        return results

    def get_obligations(
        self, exchange: str, obligation_type: str | None = None, agreement: str | None = None
    ) -> list[dict]:
        results = []
        for policy in self.get_policy(exchange, agreement):
            for ob in policy.compliance_obligations:
                if obligation_type is None or ob.type.value == obligation_type:
                    results.append({
                        "agreement_type": policy.agreement_type.value,
                        "type": ob.type.value,
                        "description": ob.description,
                        "duration": ob.duration,
                        "details": ob.details,
                    })
        return results

    def get_section_text(self, exchange: str, section_number: str, agreement: str | None = None) -> list[dict]:
        results = []
        for policy in self.get_policy(exchange, agreement):
            for sec in policy.sections:
                if sec.number == section_number:
                    results.append({
                        "agreement_type": policy.agreement_type.value,
                        "number": sec.number,
                        "title": sec.title,
                        "text": sec.text,
                        "page": sec.page,
                    })
        return results

    def search_policies(self, query: str, exchange: str | None = None, agreement: str | None = None) -> list[dict]:
        """Full-text search across policy sections, custom concepts, and raw annotations."""
        query_lower = query.lower()
        results = []
        for (ex, at), policy in self._policies.items():
            if exchange and ex != exchange.lower():
                continue
            if agreement and at != agreement:
                continue

            for sec in policy.sections:
                if query_lower in sec.text.lower() or query_lower in sec.title.lower():
                    results.append({
                        "exchange": policy.exchange,
                        "agreement_type": at,
                        "section": sec.number,
                        "title": sec.title,
                        "excerpt": _excerpt(sec.text, query_lower),
                        "page": sec.page,
                    })

            # Also search extension fields so future exchanges remain discoverable
            for concept in policy.custom_concepts:
                searchable = f"{concept.concept_name} {concept.description} {concept.extracted_text or ''}"
                if query_lower in searchable.lower():
                    results.append({
                        "exchange": policy.exchange,
                        "agreement_type": at,
                        "section": ", ".join(concept.source_sections) or "custom_concept",
                        "title": concept.concept_name,
                        "excerpt": _excerpt(concept.description, query_lower),
                        "page": None,
                    })

            for ann in policy.raw_annotations:
                if query_lower in ann.text.lower():
                    results.append({
                        "exchange": policy.exchange,
                        "agreement_type": at,
                        "section": ann.section or "raw_annotation",
                        "title": f"Unmapped clause [{ann.annotation_type}]",
                        "excerpt": _excerpt(ann.text, query_lower),
                        "page": ann.page,
                    })

        return results

    def get_fees(self, exchange: str, product_family: str | None = None, agreement: str | None = None) -> list[dict]:
        """Return fee lines, optionally filtered by product family."""
        results = []
        for policy in self.get_policy(exchange, agreement):
            if not policy.fee_structure:
                continue
            for fl in policy.fee_structure.fee_lines:
                if product_family and fl.product_family and fl.product_family.lower() != product_family.lower():
                    continue
                entry = {
                    "agreement_type": policy.agreement_type.value,
                    "description": fl.description,
                    "amount": fl.amount,
                    "frequency": fl.frequency,
                    "currency": fl.currency,
                }
                if fl.unit_of_count:
                    entry["unit_of_count"] = fl.unit_of_count.value
                if fl.user_category:
                    entry["user_category"] = fl.user_category.value
                if fl.product_family:
                    entry["product_family"] = fl.product_family
                if fl.tier_bands:
                    entry["tier_bands"] = [tb.model_dump() for tb in fl.tier_bands]
                if fl.minimum_fee:
                    entry["minimum_fee"] = fl.minimum_fee
                if fl.effective_date:
                    entry["effective_date"] = fl.effective_date
                results.append(entry)
        return results

    def get_custom_concepts(
        self,
        exchange: str,
        tags: list[str] | None = None,
        agreement: str | None = None,
    ) -> list[dict]:
        """Return ExtendedConcept entries, optionally filtered by tag."""
        results = []
        for policy in self.get_policy(exchange, agreement):
            for concept in policy.custom_concepts:
                if tags and not any(t in concept.tags for t in tags):
                    continue
                entry: dict = {
                    "agreement_type": policy.agreement_type.value,
                    "concept_name": concept.concept_name,
                    "description": concept.description,
                    "source_sections": concept.source_sections,
                    "tags": concept.tags,
                }
                if concept.normalized_name is not None:
                    entry["normalized_name"] = concept.normalized_name
                if concept.confidence is not None:
                    entry["confidence"] = concept.confidence
                if concept.extracted_text is not None:
                    entry["extracted_text"] = concept.extracted_text
                results.append(entry)
        return results

    def get_custom_attributes(
        self,
        exchange: str,
        key: str | None = None,
        agreement: str | None = None,
    ) -> list[dict]:
        """Return custom_attributes dicts across matching policies.

        If key is provided, only policies that contain that key are returned,
        and the result includes the specific value under 'value'.
        """
        results = []
        for policy in self.get_policy(exchange, agreement):
            if not policy.custom_attributes:
                continue
            if key is not None:
                if key not in policy.custom_attributes:
                    continue
                results.append({
                    "agreement_type": policy.agreement_type.value,
                    "key": key,
                    "value": policy.custom_attributes[key],
                })
            else:
                results.append({
                    "agreement_type": policy.agreement_type.value,
                    "attributes": policy.custom_attributes,
                })
        return results

    def get_benchmarks(self, exchange: str) -> list[dict]:
        """Return benchmark license information."""
        results = []
        for policy in self.get_policy(exchange):
            for bl in policy.benchmark_licenses:
                results.append({
                    "agreement_type": policy.agreement_type.value,
                    "benchmark_name": bl.benchmark_name,
                    "license_tiers": bl.license_tiers,
                    "geographic_scope": bl.geographic_scope,
                    "conditional_waivers": bl.conditional_waivers,
                })
        return results


def _excerpt(text: str, query: str, context: int = 200) -> str:
    """Extract a short excerpt around the query match."""
    idx = text.lower().find(query)
    if idx == -1:
        return text[:context] + "..." if len(text) > context else text
    start = max(0, idx - context // 2)
    end = min(len(text), idx + len(query) + context // 2)
    excerpt = text[start:end]
    if start > 0:
        excerpt = "..." + excerpt
    if end < len(text):
        excerpt = excerpt + "..."
    return excerpt
