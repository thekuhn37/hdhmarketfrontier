from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from .enums import (
    AgreementType,
    DataCategory,
    ObligationType,
    ServiceProviderRole,
    TerminationTrigger,
    UnitOfCountType,
    UseClassification,
    UseContext,
    UserCategory,
)


class LicenseScope(BaseModel):
    grant_type: str
    territory: str | None = None
    sublicensable: bool = False
    transferable: bool = False
    exclusive: bool = False
    description: str = ""


class DataCategoryDefinition(BaseModel):
    category: DataCategory
    description: str
    timing_constraint: str | None = None
    delay_period: str | None = None


class UsePolicy(BaseModel):
    classification: UseClassification
    description: str
    conditions: list[str] = []
    source_section: str | None = None
    use_context: UseContext | None = None
    applicable_user_categories: list[UserCategory] = []
    applicable_product_families: list[str] = []


class TransformationRequirement(BaseModel):
    description: str
    criteria: list[str] = []
    verification_authority: str | None = None


class NewOriginalWork(BaseModel):
    description: str
    qualification_criteria: list[str] = []
    requires_separate_agreement: bool = True
    calculator_fees: dict[str, str] = {}


class TierBand(BaseModel):
    lower_bound: int | float
    upper_bound: int | float | None = None
    amount: str


class FeeLine(BaseModel):
    description: str
    unit_of_count: UnitOfCountType | None = None
    user_category: UserCategory | None = None
    amount: str
    currency: str = "AUD"
    frequency: str = "monthly"
    tier_bands: list[TierBand] = []
    minimum_fee: str | None = None
    effective_date: str | None = None
    product_family: str | None = None


class FeeWaiver(BaseModel):
    description: str
    conditions: list[str] = []
    applies_to: str = ""


class FeeStructure(BaseModel):
    payment_terms: str = ""
    late_penalty: str = ""
    escalation: str = ""
    refund: str = ""
    tax: str = ""
    pro_rata: str = ""
    unit_of_count: str | None = None
    reporting_requirements: str = ""
    fee_lines: list[FeeLine] = []
    fee_waivers: list[FeeWaiver] = []


class ComplianceObligation(BaseModel):
    type: ObligationType
    description: str
    duration: str = ""
    details: list[str] = []


class TerminationProvision(BaseModel):
    trigger: TerminationTrigger
    initiated_by: str = ""
    notice_period: str = ""
    consequences: str = ""


class WindDownProvision(BaseModel):
    description: str
    max_duration: str = ""
    conditions: list[str] = []


class RedistributionRestriction(BaseModel):
    description: str
    exceptions: list[str] = []
    service_provider_rules: list[str] = []


class AttributionRequirement(BaseModel):
    legend_text: str = ""
    trademark_rules: str = ""
    delay_labeling: str = ""
    display_conditions: list[str] = []


class InternalControlRequirement(BaseModel):
    description: str
    requirements: list[str] = []


class AccessEntitlementRequirement(BaseModel):
    description: str
    unique_id_required: bool = True
    concurrent_access_prohibited: bool = True
    qualification_test_required: bool = False
    approved_system_required: bool = False


class LiabilityProvision(BaseModel):
    liability_cap: str = ""
    cap_amount: str = ""
    exclusions: list[str] = []
    indemnification: str = ""
    ip_indemnification: str = ""


class DisputeResolution(BaseModel):
    governing_law: str = ""
    arbitration_body: str | None = None
    venue: str = ""
    language: str = ""
    negotiation_period: str = ""
    court_jurisdiction: str = ""


class SuspensionProvision(BaseModel):
    trigger: str
    notice_period: str = ""
    cure_period: str = ""
    consequences: str = ""
    requalification_required: bool = False


class SubscriberAgreementRequirement(BaseModel):
    description: str
    mandatory_terms: list[str] = []


class ForceProvision(BaseModel):
    description: str
    covered_events: list[str] = []


class BenchmarkLicense(BaseModel):
    benchmark_name: str
    license_tiers: dict[str, str] = {}
    geographic_scope: str = ""
    conditional_waivers: list[str] = []


class ProductFamily(BaseModel):
    name: str
    description: str = ""
    data_categories: list[DataCategory] = []
    use_contexts: list[UseContext] = []


class Section(BaseModel):
    number: str
    title: str
    text: str
    page: int | None = None


SCHEMA_VERSION = "1.0"


class ExtendedConcept(BaseModel):
    """A legal concept that has no direct mapping in the core ExchangePolicy fields.

    Future parsers use this when they encounter clauses (e.g., AI training rights,
    blockchain distribution) that don't fit any existing typed field.
    The confidence field signals how certain the parser is about the mapping.
    """
    concept_name: str
    normalized_name: str | None = None
    description: str
    source_sections: list[str] = []
    confidence: float | None = None  # 0.0–1.0; None = not assessed
    extracted_text: str | None = None
    tags: list[str] = []


class RawAnnotation(BaseModel):
    """Verbatim preservation of an unmapped or ambiguous legal clause.

    Parsers append here rather than silently dropping text that doesn't fit
    any existing schema field. This ensures no information is lost, and future
    schema versions or ontology work can revisit these annotations.
    """
    section: str | None = None
    text: str
    page: int | None = None
    annotation_type: str = "unmapped"  # unmapped | ambiguous | uncertain
    note: str | None = None


class ExchangePolicy(BaseModel):
    exchange: str
    agreement_type: AgreementType
    agreement_title: str = ""
    version: str = ""
    definitions: dict[str, str] = {}
    product_families: list[ProductFamily] = []
    license_scope: LicenseScope | None = None
    data_categories: list[DataCategoryDefinition] = []
    use_policies: list[UsePolicy] = []
    transformation_requirements: list[TransformationRequirement] = []
    new_original_works: list[NewOriginalWork] = []
    fee_structure: FeeStructure | None = None
    compliance_obligations: list[ComplianceObligation] = []
    termination_provisions: list[TerminationProvision] = []
    wind_down: WindDownProvision | None = None
    redistribution_restrictions: list[RedistributionRestriction] = []
    attribution_requirements: list[AttributionRequirement] = []
    internal_control_requirements: list[InternalControlRequirement] = []
    access_entitlement_requirements: list[AccessEntitlementRequirement] = []
    liability: LiabilityProvision | None = None
    dispute_resolution: DisputeResolution | None = None
    benchmark_licenses: list[BenchmarkLicense] = []
    suspension_provisions: list[SuspensionProvision] = []
    subscriber_agreement_requirements: list[SubscriberAgreementRequirement] = []
    force_majeure: ForceProvision | None = None
    document_priority: list[str] = []
    sections: list[Section] = []

    # --- Extensibility fields (Phase 1) ---
    # These fields are additive. Existing parsers do not populate them and
    # existing JSON files that lack them load fine (defaults apply).
    schema_version: str = SCHEMA_VERSION
    custom_attributes: dict[str, Any] = {}
    custom_concepts: list[ExtendedConcept] = []
    raw_annotations: list[RawAnnotation] = []
