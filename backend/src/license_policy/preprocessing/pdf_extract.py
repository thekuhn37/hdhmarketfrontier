"""Generic PDF text extraction using pymupdf with font metadata."""

from __future__ import annotations

import re
from dataclasses import dataclass, field

import fitz


@dataclass
class RawSection:
    number: str
    title: str
    text: str
    page: int


@dataclass
class RawDefinition:
    term: str
    body: str


@dataclass
class ExtractedDocument:
    title: str
    sections: list[RawSection] = field(default_factory=list)
    definitions: list[RawDefinition] = field(default_factory=list)
    full_text: str = ""


def _is_bold(span: dict) -> bool:
    flags = span.get("flags", 0)
    # bit 4 = bold in pymupdf flags
    if flags & (1 << 4):
        return True
    font = span.get("font", "").lower()
    return "bold" in font


def _extract_page_spans(page: fitz.Page) -> list[dict]:
    """Extract all text spans with font metadata from a page."""
    spans = []
    blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
    for block in blocks:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "").strip()
                if text:
                    spans.append({
                        "text": text,
                        "bold": _is_bold(span),
                        "size": span.get("size", 0),
                        "font": span.get("font", ""),
                    })
    return spans


# Pattern for section headings like "2.", "2.1", "2.1(a)", "11.13"
SECTION_NUM_RE = re.compile(r"^(\d+\.?\d*\.?\d*)\s*$")
SECTION_HEADING_RE = re.compile(r"^(\d+\.?\d*\.?\d*)\s+(.+)$")


def extract_document(pdf_path: str) -> ExtractedDocument:
    """Extract structured sections and definitions from a PDF."""
    doc = fitz.open(pdf_path)
    all_text_parts: list[str] = []
    page_texts: list[tuple[int, str]] = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        all_text_parts.append(text)
        page_texts.append((page_num + 1, text))

    full_text = "\n".join(all_text_parts)

    # Detect title from first page
    first_page_spans = _extract_page_spans(doc[0])
    title = ""
    for span in first_page_spans:
        if span["bold"] and span["size"] > 12 and len(span["text"]) > 10:
            title = span["text"].strip()
            break

    # Build sections by scanning full text for section number patterns
    sections = _parse_sections(page_texts)
    definitions = _parse_definitions(sections)

    doc.close()
    return ExtractedDocument(
        title=title,
        sections=sections,
        definitions=definitions,
        full_text=full_text,
    )


def _parse_sections(page_texts: list[tuple[int, str]]) -> list[RawSection]:
    """Parse sections from page texts using line-by-line scanning."""
    sections: list[RawSection] = []
    # Combine all text with page tracking
    lines_with_pages: list[tuple[str, int]] = []
    for page_num, text in page_texts:
        for line in text.split("\n"):
            lines_with_pages.append((line.strip(), page_num))

    # Heading patterns - match lines that start with a section number
    heading_re = re.compile(r"^(\d+(?:\.\d+)*)\s*(.*)")
    # Skip lines that are just page numbers or headers
    skip_re = re.compile(r"^Page \d+ of \d+|^CONFIDENTIAL|^CME GROUP|^Version \d+")

    current_number = ""
    current_title = ""
    current_text_lines: list[str] = []
    current_page = 1

    for line, page_num in lines_with_pages:
        if not line or skip_re.match(line):
            continue

        m = heading_re.match(line)
        if m:
            num = m.group(1)
            rest = m.group(2).strip()
            # Only treat as a new section if the number looks like a real section number
            # (not just a random number in text) - must be top-level or have dots
            parts = num.split(".")
            if len(parts) <= 3 and all(p.isdigit() for p in parts if p):
                # Save previous section
                if current_number:
                    sections.append(RawSection(
                        number=current_number,
                        title=current_title,
                        text="\n".join(current_text_lines).strip(),
                        page=current_page,
                    ))
                current_number = num
                current_title = rest
                current_text_lines = []
                current_page = page_num
                if rest:
                    # The rest of the line might be the title or start of content
                    # Check if it's ALL CAPS (likely a title)
                    if rest.isupper() or (len(rest.split()) <= 6 and rest[0].isupper()):
                        current_title = rest
                    else:
                        current_title = ""
                        current_text_lines.append(rest)
                continue

        current_text_lines.append(line)

    # Don't forget the last section
    if current_number:
        sections.append(RawSection(
            number=current_number,
            title=current_title,
            text="\n".join(current_text_lines).strip(),
            page=current_page,
        ))

    return sections


def _parse_definitions(sections: list[RawSection]) -> list[RawDefinition]:
    """Extract definitions from Section 1 (definitions section)."""
    definitions: list[RawDefinition] = []

    # Find the definitions section (section 1 or "DEFINITIONS")
    def_section = None
    for s in sections:
        if s.number == "1" and ("DEFINITION" in s.title.upper() or "DEFINITION" in s.text[:100].upper()):
            def_section = s
            break
        if s.number == "1" and not s.title:
            def_section = s
            break

    if not def_section:
        return definitions

    # Parse "Term: definition" patterns from the definitions text
    text = def_section.text
    # Bold term pattern: "Term:" or "Term Name:" at start of line
    term_re = re.compile(r"^([A-Z][A-Za-z\s]+?):\s*(.+)", re.MULTILINE)

    matches = list(term_re.finditer(text))
    for i, m in enumerate(matches):
        term = m.group(1).strip()
        # Body extends until next term or end
        start = m.start(2)
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        # Clean up multi-line body
        body = re.sub(r"\s+", " ", body)
        definitions.append(RawDefinition(term=term, body=body))

    return definitions
