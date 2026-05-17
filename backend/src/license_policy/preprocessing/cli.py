"""CLI for preprocessing exchange license PDFs into structured JSON."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .normalize import normalize
from .pdf_extract import extract_document


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Preprocess exchange license PDF into structured JSON."
    )
    parser.add_argument("pdf_path", help="Path to the PDF file to process.")
    parser.add_argument(
        "--output", "-o",
        help="Output JSON file path. Defaults to stdout.",
    )
    parser.add_argument(
        "--type", "-t",
        choices=["derived_data", "information", "asx_product_guide", "asx_fee_schedule", "asx_marketsource_agreement"],
        help="Agreement type. Auto-detected if not specified.",
    )
    args = parser.parse_args()

    pdf_path = Path(args.pdf_path)
    if not pdf_path.exists():
        print(f"Error: PDF not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    doc = extract_document(str(pdf_path))
    policy = normalize(doc, agreement_type=args.type)
    json_str = policy.model_dump_json(indent=2)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json_str)
        print(f"Wrote {output_path} ({len(json_str)} bytes)", file=sys.stderr)
    else:
        print(json_str)
