# License Policy MCP Server

An MCP (Model Context Protocol) server that preprocesses financial exchange license agreement PDFs into structured data and serves them via tools and resources. Enables LLMs to accurately answer complex licensing questions across multiple exchanges.

## What It Does

Financial exchanges publish dense legal PDFs governing how their market data can be used. This project:

1. **Extracts** text from exchange license PDFs using pymupdf with font-based section detection
2. **Parses** each agreement into a normalized schema (`ExchangePolicy`) using agreement-specific parsers
3. **Serves** the structured data via MCP tools, resources, and prompts

```
PDF → pymupdf extraction → agreement parser → ExchangePolicy JSON → MCP Server → Claude
```

## Supported Exchanges

### CME Group
| Agreement | Document | Key Content |
|-----------|----------|-------------|
| Derived Data License | `CME-derived-data-license-agreement.pdf` | Governs creation/distribution of derived products (indexes, ETFs, etc.) |
| Information License | `CME_information-license-agreement-september-2024.pdf` | Governs receipt, display, and internal use of market data |

### ASX (Australian Securities Exchange)
| Agreement | Document | Key Content |
|-----------|----------|-------------|
| MarketSource Agreement | `ASX_marketsource-agreement.pdf` | General Terms & Conditions — the binding bilateral license (termination, liability, suspension, dispute resolution) |
| Product & Services Guide | `ASX_market-information-product-and-services-guide.pdf` | Operational rulebook — licensing categories, units of count, reporting, audit |
| Fee Schedule | `ASX_Information and Technical Services Fee schedule.pdf` | Fee tables — market data, connectivity, benchmarks (BBSW/AONIA), tiered pricing |

## Quick Start

### Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) package manager

### Install

```bash
git clone git@github.com:polypauldeep/license-policy.git
cd license-policy
uv sync
```

### Preprocess PDFs

Place exchange PDFs in `data/raw/`, then run:

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

The CLI auto-detects the agreement type from the PDF content. You can also specify it explicitly with `--type`.

### Run the MCP Server

**Test with MCP Inspector:**
```bash
uv run mcp dev src/license_policy/server/main.py
```

**Register with Claude Code:**
```bash
claude mcp add license-policy -- uv run serve
```

## MCP Interface

### Tools

| Tool | Purpose |
|------|---------|
| `check_use_permitted` | Check if a specific use is permitted/prohibited/conditional |
| `get_fee_for_use` | Look up applicable fees for a use case |
| `get_unit_of_count` | Determine which billing unit applies |
| `compare_exchanges` | Compare a dimension (fees, termination, audit, etc.) across exchanges |
| `get_compliance_obligations` | Get audit, reporting, record-keeping obligations |
| `get_transformation_requirements` | Get derived data / New Original Work rules |
| `get_attribution_requirements` | Get display and attribution requirements |
| `search_policy` | Full-text search across policy sections |

### Resources

| URI | Returns |
|-----|---------|
| `policy://exchanges` | Available exchanges with agreement types and product families |
| `policy://{exchange}/summary` | High-level policy summary |
| `policy://{exchange}/use-policies` | All permitted/prohibited/conditional uses |
| `policy://{exchange}/fees` | Fee structure overview |
| `policy://{exchange}/fees/{product_family}` | Fees filtered by product family |
| `policy://{exchange}/compliance` | Compliance obligations |
| `policy://{exchange}/termination` | Termination and wind-down provisions |
| `policy://{exchange}/liability` | Liability caps and indemnification |
| `policy://{exchange}/benchmarks` | Benchmark licensing tiers |
| `policy://{exchange}/product-families` | Product families and data categories |
| `policy://{exchange}/data-categories` | Data category definitions |
| `policy://{exchange}/attribution` | Attribution/display requirements |
| `policy://{exchange}/section/{number}` | Raw section text |
| `policy://{exchange}/full` | Complete policy JSON |

### Prompts

| Prompt | Purpose |
|--------|---------|
| `analyze_use_case` | Analyze whether a product/use case complies with the license |
| `compliance_checklist` | Generate a compliance checklist for an exchange |

## Data Model

All agreements are normalized into a common `ExchangePolicy` Pydantic model:

```
ExchangePolicy
├── exchange, agreement_type, version
├── product_families[]          # ASX: MarketSource, ComNews, ReferencePoint
├── license_scope               # grant type, territory, transferability
├── use_policies[]              # permitted/prohibited/conditional + use_context
├── fee_structure
│   ├── fee_lines[]             # per-user, per-query, per-app, tiered
│   └── fee_waivers[]           # academic, trial, DR/BCP
├── compliance_obligations[]    # audit, reporting, record-keeping
├── termination_provisions[]    # breach, convenience, insolvency, etc.
├── suspension_provisions[]     # ASX: payment failure, tech issues, regulatory
├── subscriber_agreement_requirements[]  # ASX: 10 mandatory downstream terms
├── liability                   # caps, exclusions, IP indemnification
├── dispute_resolution          # governing law, arbitration/negotiation, venue
├── force_majeure               # covered events
├── benchmark_licenses[]        # ASX BBSW/AONIA multi-tier
└── sections[]                  # raw text for full-text search
```

## Example Questions

Once registered with Claude Code, you can ask questions like:

- "Can I use CME data to create CFDs?"
- "What are ASX's real-time data fees for professional users?"
- "What audit obligations do I have under ASX's MarketSource Agreement?"
- "Compare termination provisions between CME and ASX"
- "Can I create a financial index using ASX data and distribute it to asset managers?"
- "If I subscribe to data through Bloomberg, do I still need a direct exchange contract?"
- "What are the Non-Display Application fees for algorithmic trading?"

## Adding a New Exchange

1. Place the PDF in `data/raw/`
2. Create a parser in `src/license_policy/preprocessing/` that returns `ExchangePolicy`
3. Add detection logic to `normalize.py:detect_agreement_type()`
4. Add the parser to the `parsers` dict in `normalize.py:normalize()`
5. Add the type to `cli.py` `--type` choices
6. Add any new enum values to `models/enums.py`
7. Preprocess: `uv run preprocess data/raw/<file>.pdf -o data/processed/<output>.json`

## Architecture Diagram

Open `mcp-flow-diagram.html` in a browser for an interactive architecture diagram showing the full preprocessing pipeline, query flow, and tool mapping.

## License

This project preprocesses publicly available exchange license agreements for research and compliance analysis purposes.
