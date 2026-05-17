from enum import Enum


class AgreementType(str, Enum):
    derived_data = "derived_data"
    information = "information"
    redistribution = "redistribution"
    product_guide = "product_guide"
    fee_schedule = "fee_schedule"
    marketsource_agreement = "marketsource_agreement"


class DataCategory(str, Enum):
    real_time = "real_time"
    delayed = "delayed"
    end_of_day = "end_of_day"
    snapshot = "snapshot"
    historical = "historical"
    announcements = "announcements"
    reference_data = "reference_data"
    benchmark = "benchmark"


class UseClassification(str, Enum):
    permitted = "permitted"
    prohibited = "prohibited"
    conditional = "conditional"


class UseContext(str, Enum):
    display = "display"
    non_display = "non_display"
    datafeed = "datafeed"
    new_original_work = "new_original_work"
    internal_use = "internal_use"
    agency = "agency"
    custody = "custody"
    redistribution = "redistribution"
    website = "website"
    print_media = "print_media"
    television = "television"
    wallboard = "wallboard"


class UnitOfCountType(str, Enum):
    per_device = "per_device"
    per_user = "per_user"
    per_application = "per_application"
    per_venue = "per_venue"
    per_query = "per_query"
    per_minute = "per_minute"
    per_entity = "per_entity"
    enterprise = "enterprise"
    capped = "capped"


class UserCategory(str, Enum):
    professional = "professional"
    non_professional = "non_professional"
    academic = "academic"


class ObligationType(str, Enum):
    audit = "audit"
    record_keeping = "record_keeping"
    disclaimer = "disclaimer"
    reporting = "reporting"
    notice = "notice"
    confidentiality = "confidentiality"
    indemnification = "indemnification"
    attribution = "attribution"
    internal_controls = "internal_controls"
    personal_data = "personal_data"
    notification = "notification"
    access_entitlement_system = "access_entitlement_system"
    reporting_format = "reporting_format"


class TerminationTrigger(str, Enum):
    breach = "breach"
    convenience = "convenience"
    change_of_control = "change_of_control"
    fee_revision = "fee_revision"
    reverse_engineering = "reverse_engineering"
    liquidation = "liquidation"
    sublicense_change = "sublicense_change"
    information_change = "information_change"
    material_breach_irremediable = "material_breach_irremediable"
    non_renewal = "non_renewal"
    law_change = "law_change"
    information_agreement_terminated = "information_agreement_terminated"
    insolvency = "insolvency"
    suspension_extended = "suspension_extended"
    trading_restriction_breach = "trading_restriction_breach"
    format_change = "format_change"
    urgent_change = "urgent_change"


class ServiceProviderRole(str, Enum):
    distributor = "distributor"
    sub_vendor = "sub_vendor"
    subscriber_firm = "subscriber_firm"
    asp = "asp"
    bsp = "bsp"
    msp = "msp"
    nsp = "nsp"
    ntp = "ntp"
    service_facilitator = "service_facilitator"
