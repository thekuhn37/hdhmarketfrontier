# CLAUDE.md

## Project Overview

MCP server for financial exchange license policy data. Preprocesses exchange license agreement PDFs (CME, ASX) into structured JSON via a common Pydantic schema, then serves that data over MCP with tools, resources, and prompts. Enables Claude to answer complex licensing questions like "Can I use CME data to create CFDs?" or "What are ASX's audit requirements?"

## Tech Stack

- **Python 3.11+** with `uv` for dependency management
- **Pydantic v2** for data models
- **pymupdf** for PDF text extraction with font metadata
- **mcp[cli] (FastMCP)** for the MCP server
- **hatchling** as build backend

## Project Structure

```
src/license_policy/
  models/
    enums.py          # AgreementType, DataCategory, UseClassification, etc.
    schema.py         # ExchangePolicy (root), UsePolicy, FeeStructure, etc.
  preprocessing/
    pdf_extract.py    # Generic pymupdf text+font extraction
    cme_derived_parser.py
    cme_info_parser.py
    asx_guide_parser.py
    asx_fees_parser.py
    asx_agreement_parser.py
    normalize.py      # Auto-detects agreement type, routes to correct parser
    cli.py            # `uv run preprocess` entry point
  server/
    main.py           # FastMCP server (tools, resources, prompts)
    data_store.py     # PolicyStore: loads JSON, indexes by (exchange, agreement_type)
data/
  raw/                # Source PDFs
  processed/          # Preprocessed JSON (one per agreement)
```

## Key Commands

```bash
# Install dependencies
uv sync

# Preprocess all PDFs (must be run before starting server)
uv run preprocess data/raw/CME-derived-data-license-agreement.pdf -o data/processed/cme-derived-data.json
uv run preprocess data/raw/CME_information-license-agreement-september-2024.pdf -o data/processed/cme-information.json
uv run preprocess "data/raw/ASX_market-information-product-and-services-guide.pdf" -o data/processed/asx-product-guide.json
uv run preprocess "data/raw/ASX_Information and Technical Services Fee schedule.pdf" -o data/processed/asx-fee-schedule.json
uv run preprocess data/raw/ASX_marketsource-agreement.pdf -o data/processed/asx-marketsource-agreement.json

# Run MCP server (for development/testing with MCP Inspector)
uv run mcp dev src/license_policy/server/main.py

# Register with Claude Code
claude mcp add license-policy -- uv run serve
```

## Architecture

### Two-Phase Design

1. **Preprocessing (offline)**: PDF → pymupdf extraction → agreement-specific parser → ExchangePolicy Pydantic model → JSON file
2. **Serving (runtime)**: JSON files → PolicyStore (in-memory index by exchange + agreement_type) → MCP tools/resources

### Data Flow

- `pdf_extract.py` uses pymupdf `page.get_text('dict')` for font-based heading detection
- `normalize.py` auto-detects agreement type from title/text keywords, routes to the correct parser
- Each parser produces an `ExchangePolicy` object — the common schema across all exchanges
- `data_store.py` loads all `data/processed/*.json` at startup, indexes by `(exchange, agreement_type)` tuple

### Adding a New Exchange/Agreement

1. Place the PDF in `data/raw/`
2. Create a parser in `preprocessing/` that returns `ExchangePolicy`
3. Add detection logic to `normalize.py:detect_agreement_type()`
4. Add the parser to the `parsers` dict in `normalize.py:normalize()`
5. Add the agreement type to `cli.py` `--type` choices
6. Add enum values to `enums.py` if needed
7. Run `uv run preprocess` and verify output

## Conventions

- All parsers return `ExchangePolicy` — new fields must have defaults to avoid breaking existing parsers
- Enums in `enums.py`, models in `schema.py` — keep them separate
- Agreement type strings use snake_case (e.g., `marketsource_agreement`)
- Exchange names are case-insensitive in queries (lowered at storage)
- PDFs should be read using pymupdf, not Claude's built-in Read tool

## Current Exchanges

| Exchange | Agreement Types | Key Concepts |
|----------|----------------|--------------|
| **CME** | `derived_data`, `information` | Licensee Group, Information Agreement prerequisite, Appendix A products, CFD/ETF/index prohibitions |
| **ASX** | `product_guide`, `fee_schedule`, `marketsource_agreement` | 3-document framework, product families (MarketSource/ComNews/ReferencePoint), granular units of count, suspension provisions, subscriber agreement cascade |

## MCP Server Interface

**8 Tools**: `check_use_permitted`, `search_policy`, `get_compliance_obligations`, `get_fee_for_use`, `get_unit_of_count`, `compare_exchanges`, `get_transformation_requirements`, `get_attribution_requirements`

**14 Resources**: `policy://exchanges`, `policy://{exchange}/summary`, `policy://{exchange}/product-families`, `policy://{exchange}/data-categories`, `policy://{exchange}/use-policies`, `policy://{exchange}/fees`, `policy://{exchange}/fees/{product_family}`, `policy://{exchange}/compliance`, `policy://{exchange}/termination`, `policy://{exchange}/attribution`, `policy://{exchange}/liability`, `policy://{exchange}/benchmarks`, `policy://{exchange}/section/{number}`, `policy://{exchange}/full`

**2 Prompts**: `analyze_use_case`, `compliance_checklist`
