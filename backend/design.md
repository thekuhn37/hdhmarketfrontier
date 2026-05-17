# License Policy MCP Server — Design Document

## Overview

Financial exchanges publish dense legal PDFs that govern how their market data can be used. Reading and interpreting these agreements manually is slow and error-prone. This project solves that by converting those PDFs into structured, machine-readable JSON and serving the data through an MCP (Model Context Protocol) server — enabling LLMs to answer complex licensing questions accurately.

**Example questions the system can answer:**

- "Can I use CME data to create CFDs?"
- "What are ASX's real-time data fees for professional users?"
- "What audit obligations do I have under the ASX MarketSource Agreement?"
- "Compare termination provisions between CME and ASX."
- "If I subscribe to data through Bloomberg, do I still need a direct exchange contract?"

---

## Architecture

The system is split into two independent phases.

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1 — Preprocessing (offline, run once per PDF)            │
│                                                                 │
│  PDF (data/raw/)                                                │
│    └─ pdf_extract.py     pymupdf: extracts text + font metadata │
│         └─ normalize.py  detects agreement type, routes parser  │
│              └─ *_parser.py  builds ExchangePolicy object       │
│                   └─ cli.py  serializes → data/processed/*.json │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2 — Serving (runtime, always-on MCP server)              │
│                                                                 │
│  data/processed/*.json                                          │
│    └─ data_store.py   PolicyStore: loads + indexes all JSON     │
│         └─ main.py    FastMCP: exposes tools, resources, prompts│
│              └─ Claude / MCP client queries the server          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
license-policy-main/
├── data/
│   ├── raw/                        Raw PDF files (input)
│   └── processed/                  Preprocessed JSON files (output)
├── src/license_policy/
│   ├── models/
│   │   ├── enums.py                All enum types (AgreementType, UseClassification, etc.)
│   │   └── schema.py               Pydantic models (ExchangePolicy root + all sub-models)
│   ├── preprocessing/
│   │   ├── pdf_extract.py          Generic PDF text + font extraction via pymupdf
│   │   ├── normalize.py            Agreement type detection + parser routing (registry)
│   │   ├── cme_derived_parser.py   CME Derived Data License Agreement parser
│   │   ├── cme_info_parser.py      CME Information License Agreement parser
│   │   ├── asx_guide_parser.py     ASX Product & Services Guide parser
│   │   ├── asx_fees_parser.py      ASX Fee Schedule parser
│   │   ├── asx_agreement_parser.py ASX MarketSource Agreement parser
│   │   └── cli.py                  `uv run preprocess` entry point
│   └── server/
│       ├── main.py                 FastMCP server (tools, resources, prompts)
│       └── data_store.py           PolicyStore: in-memory index by (exchange, agreement_type)
├── pyproject.toml                  Dependencies + script entry points
└── uv.lock                         Locked dependency versions
```

---

## Phase 1: Preprocessing Pipeline

### Step 1 — PDF Extraction (`pdf_extract.py`)

Uses **pymupdf** (`fitz`) to extract text with structural metadata:

- `page.get_text("dict")` returns blocks → lines → spans, each span carrying font size, bold flag, and font name
- The first bold+large span on page 1 becomes the document title
- Lines matching `^\d+(\.\d+)*` are treated as section headings
- Section body text is accumulated until the next heading
- Section 1 is scanned for `"Term: definition"` patterns to extract a definitions dictionary

Output: `ExtractedDocument(title, sections[], definitions[], full_text)`

### Step 2 — Agreement Type Detection (`normalize.py`)

`detect_agreement_type()` keyword-matches the document title and the first 3,000 characters of text:

| Keyword matched | Detected type |
|-----------------|---------------|
| `"derived data"` | `derived_data` |
| `"information license"` | `information` |
| `"product and services guide"` | `asx_product_guide` |
| `"schedule of fees"` | `asx_fee_schedule` |
| `"marketsource"` + `"general terms and conditions"` | `asx_marketsource_agreement` |

You can also override detection by passing `--type` to the CLI.

### Step 3 — Agreement Parsing (`*_parser.py`)

Each parser is a pure function:

```python
def parse_cme_derived(doc: ExtractedDocument) -> ExchangePolicy: ...
```

Parsers use a hybrid approach:
- **Structured fields** (use policies, fees, termination provisions, etc.) are hardcoded from reading the agreement — this produces reliable, well-typed data
- **`sections[]`** are populated directly from `doc.sections` — preserving raw text for full-text search

The `parsers` dict in `normalize.py` is the **parser registry**. Adding a new exchange means adding one entry here.

### Step 4 — CLI (`cli.py`)

```bash
uv run preprocess data/raw/<file>.pdf -o data/processed/<output>.json
```

The CLI extracts → normalizes → serializes the `ExchangePolicy` to JSON via `model.model_dump_json(indent=2)`.

---

## Data Model (`models/schema.py`)

All agreements are normalized into a single `ExchangePolicy` Pydantic model. Every field has a default, so new parsers don't need to populate everything.

```
ExchangePolicy
├── exchange                str                    "CME", "ASX", etc.
├── agreement_type          AgreementType          enum: derived_data, information, fee_schedule, …
├── agreement_title         str
├── version                 str
├── definitions             dict[str, str]         key terms from Section 1
│
├── product_families[]      ProductFamily          ASX: MarketSource, ComNews, ReferencePoint
├── data_categories[]       DataCategoryDefinition real_time, delayed, end_of_day, historical, …
│
├── license_scope           LicenseScope           grant type, territory, sublicensable, transferable
│
├── use_policies[]          UsePolicy
│   ├── classification      UseClassification      permitted | prohibited | conditional
│   ├── use_context         UseContext             display | non_display | datafeed | redistribution | …
│   ├── conditions[]        str
│   └── source_section      str
│
├── fee_structure           FeeStructure
│   ├── fee_lines[]         FeeLine                per-user, per-query, tiered, etc.
│   └── fee_waivers[]       FeeWaiver              academic, DR/BCP, trial
│
├── compliance_obligations[] ComplianceObligation  audit, record_keeping, disclaimer, attribution, …
├── termination_provisions[] TerminationProvision  breach, convenience, change_of_control, …
├── suspension_provisions[]  SuspensionProvision   ASX-specific: payment failure, tech issues
├── subscriber_agreement_requirements[]            ASX: 10 mandatory downstream terms
│
├── transformation_requirements[]  TransformationRequirement   derived data rules
├── new_original_works[]           NewOriginalWork             NOW qualification criteria
├── redistribution_restrictions[]  RedistributionRestriction
├── attribution_requirements[]     AttributionRequirement      legend text, trademark rules
│
├── liability               LiabilityProvision     cap, exclusions, indemnification
├── dispute_resolution      DisputeResolution      governing law, arbitration, venue
├── force_majeure           ForceProvision
├── wind_down               WindDownProvision
├── benchmark_licenses[]    BenchmarkLicense       ASX BBSW/AONIA tiers
│
└── sections[]              Section                raw text for full-text search
```

---

## Phase 2: MCP Server

### Data Store (`data_store.py`)

`PolicyStore` loads all `data/processed/*.json` at startup into a dict keyed by `(exchange.lower(), agreement_type)`. It exposes query methods:

| Method | Purpose |
|--------|---------|
| `list_exchanges()` | All exchanges + agreement types + product families |
| `get_policy(exchange, agreement?)` | One or more `ExchangePolicy` objects |
| `check_use(exchange, description)` | Keyword search across `use_policies[]` |
| `get_fees(exchange, product_family?)` | Fee lines, optionally filtered |
| `get_obligations(exchange, type?)` | Compliance obligations, optionally filtered |
| `search_policies(query, exchange?)` | Full-text search across `sections[]` |
| `get_benchmarks(exchange)` | Benchmark license tiers |

### MCP Interface (`main.py`)

Built on **FastMCP**. The server name is `"license-policy"`.

#### 8 Tools (callable by the LLM)

| Tool | Purpose |
|------|---------|
| `check_use_permitted` | Is a specific use permitted, prohibited, or conditional? |
| `get_fee_for_use` | What fees apply to a use case? |
| `get_unit_of_count` | Which billing unit applies (per-user, per-query, etc.)? |
| `compare_exchanges` | Compare fees/termination/audit/liability across exchanges |
| `get_compliance_obligations` | Audit, reporting, record-keeping requirements |
| `get_transformation_requirements` | Derived data / New Original Work rules |
| `get_attribution_requirements` | Display and attribution requirements |
| `search_policy` | Full-text search across all policy sections |

#### 14 Resources (URI-addressed read-only data)

| URI | Returns |
|-----|---------|
| `policy://exchanges` | All exchanges, agreement types, product families |
| `policy://{exchange}/summary` | High-level summary |
| `policy://{exchange}/use-policies` | All use policies |
| `policy://{exchange}/fees` | Fee structure overview |
| `policy://{exchange}/fees/{product_family}` | Fees filtered by product family |
| `policy://{exchange}/compliance` | Compliance obligations |
| `policy://{exchange}/termination` | Termination + wind-down provisions |
| `policy://{exchange}/attribution` | Attribution/display requirements |
| `policy://{exchange}/liability` | Liability caps and indemnification |
| `policy://{exchange}/benchmarks` | Benchmark licensing tiers |
| `policy://{exchange}/product-families` | Product families and data categories |
| `policy://{exchange}/data-categories` | Data category definitions |
| `policy://{exchange}/section/{number}` | Raw section text by number |
| `policy://{exchange}/full` | Complete policy JSON |

#### 2 Prompts (pre-built prompt templates)

| Prompt | Purpose |
|--------|---------|
| `analyze_use_case` | Analyze whether a product/use case complies with the license |
| `compliance_checklist` | Generate a compliance checklist for an exchange |

---

## Supported Exchanges

### CME Group

| Agreement | File | Agreement Type Key |
|-----------|------|--------------------|
| Derived Data License | `CME-derived-data-license-agreement.pdf` | `derived_data` |
| Information License | `CME_information-license-agreement-september-2024.pdf` | `information` |

CME key concepts: Licensee Group, Information Agreement prerequisite, Appendix A products, prohibitions on CFDs/ETFs/indexes.

### ASX (Australian Securities Exchange)

| Agreement | File | Agreement Type Key |
|-----------|------|--------------------|
| MarketSource Agreement | `ASX_marketsource-agreement.pdf` | `marketsource_agreement` |
| Product & Services Guide | `ASX_market-information-product-and-services-guide.pdf` | `product_guide` |
| Fee Schedule | `ASX_Information and Technical Services Fee schedule.pdf` | `fee_schedule` |

ASX key concepts: 3-document framework, product families (MarketSource / ComNews / ReferencePoint), granular units of count, suspension provisions, subscriber agreement cascade.

---

## Environment Setup

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.11+ | 3.11.x recommended; 3.14 available but unnecessary |
| uv | any | Installed at `~/.local/bin/uv` |

### Install

```bash
# Ensure uv is on PATH (add to ~/.zshrc)
export PATH="$HOME/.local/bin:$PATH"

# Install uv (if not present)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install project dependencies
cd license-policy-main
uv sync
```

### Preprocess PDFs

```bash
uv run preprocess data/raw/CME-derived-data-license-agreement.pdf \
  -o data/processed/cme-derived-data.json

uv run preprocess data/raw/CME_information-license-agreement-september-2024.pdf \
  -o data/processed/cme-information.json

uv run preprocess "data/raw/ASX_market-information-product-and-services-guide.pdf" \
  -o data/processed/asx-product-guide.json

uv run preprocess "data/raw/ASX_Information and Technical Services Fee schedule.pdf" \
  -o data/processed/asx-fee-schedule.json

uv run preprocess data/raw/ASX_marketsource-agreement.pdf \
  -o data/processed/asx-marketsource-agreement.json
```

### Run the MCP Server

```bash
# Development (MCP Inspector in browser)
uv run mcp dev src/license_policy/server/main.py

# Register with Claude Code
claude mcp add license-policy -- uv run serve
```

---

## Adding a New Exchange

Follow these steps in order:

1. **Place the PDF** in `data/raw/`

2. **Create a parser** at `src/license_policy/preprocessing/<exchange>_parser.py`:
   ```python
   def parse_<exchange>_<agreement>(doc: ExtractedDocument) -> ExchangePolicy:
       ...
       return ExchangePolicy(exchange="EXCHANGE", agreement_type=AgreementType.<type>, ...)
   ```

3. **Add detection logic** to `normalize.py → detect_agreement_type()`:
   ```python
   if "keyword from pdf" in title_lower or "keyword" in full_lower:
       return "exchange_agreement_type"
   ```

4. **Register the parser** in `normalize.py → normalize() → parsers` dict:
   ```python
   parsers = {
       ...
       "exchange_agreement_type": parse_exchange_agreement,
   }
   ```

5. **Add CLI choice** in `cli.py → --type choices`:
   ```python
   choices=[..., "exchange_agreement_type"]
   ```

6. **Add enum values** (if needed) in `models/enums.py → AgreementType`

7. **Preprocess** the PDF:
   ```bash
   uv run preprocess data/raw/<file>.pdf -o data/processed/<output>.json
   ```

8. The **server auto-discovers** the new JSON on next startup — no server code changes needed.

### Planned Exchanges

| Exchange | Status |
|----------|--------|
| Nasdaq | Planned |
| ICE | Planned |
| Deutsche Börse | Planned |
| HKEX | Planned |
| SGX | Planned |
| TMX | Planned |
| Cboe | Planned |
| NYSE | Planned |

---

## Tech Stack

| Component | Library | Version |
|-----------|---------|---------|
| MCP server | `mcp[cli]` (FastMCP) | ≥1.2.0 |
| Data validation | `pydantic` | ≥2.0 |
| PDF extraction | `pymupdf` | ≥1.25 |
| Build backend | `hatchling` | — |
| Package manager | `uv` | — |
