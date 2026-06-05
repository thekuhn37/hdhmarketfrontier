"""Meeting Summary service: transcription via OpenAI Whisper + GPT-4o report."""
from __future__ import annotations

import logging
import os
import subprocess
import tempfile
from pathlib import Path

import httpx
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

WHISPER_MAX_BYTES = 24 * 1024 * 1024  # 24 MB (OpenAI limit is 25 MB)

SUMMARY_PROMPT = """You are an expert analyst for meetings and conferences.
You will receive a full transcript. Generate a structured report with these sections:

# Executive Summary
A concise 3–5 sentence overview of the meeting or session, its main purpose, and key outcomes.

# Key Points & Insights
Bulleted list of the most important points discussed, insights shared, and conclusions reached.

# Action Items
Bulleted list of specific tasks or follow-ups mentioned. Include who is responsible if mentioned.
If none, write "None identified."

# Decisions Made
Bulleted list of any decisions, agreements, or resolutions reached.
If none, write "None identified."

# Notable Quotes
3–5 notable quotes from the session (verbatim where possible).
If none, write "None identified."

Use clear, professional language. Do not add sections beyond those listed above.

Transcript:
{transcript}"""


class MeetingSummaryService:
    def __init__(self, openai_api_key: str, supabase_url: str, supabase_service_key: str) -> None:
        self._client = AsyncOpenAI(api_key=openai_api_key)
        self._supabase_url = supabase_url.rstrip("/")
        self._supabase_key = supabase_service_key

    # ── Supabase helpers ──────────────────────────────────────────────────────

    async def _update_job(self, job_id: str, payload: dict) -> None:
        url = f"{self._supabase_url}/rest/v1/meeting_summary_jobs?id=eq.{job_id}"
        headers = {
            "apikey": self._supabase_key,
            "Authorization": f"Bearer {self._supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.patch(url, json=payload, headers=headers)
            if resp.status_code not in (200, 204):
                logger.error("Supabase update failed %s: %s", resp.status_code, resp.text)

    # ── Audio helpers ─────────────────────────────────────────────────────────

    @staticmethod
    def _compress_audio(src: Path, dst: Path) -> None:
        """Re-encode to mono 16 kHz AAC at low bitrate to fit within Whisper's 25 MB limit."""
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(src),
                "-ac", "1", "-ar", "16000",
                "-c:a", "aac", "-b:a", "32k",
                str(dst),
            ],
            check=True,
            capture_output=True,
        )

    # ── Main pipeline ─────────────────────────────────────────────────────────

    async def process(
        self,
        job_id: str,
        filename: str,
        file_bytes: bytes,
    ) -> None:
        tmp_dir = Path(tempfile.mkdtemp())
        try:
            await self._run_pipeline(job_id, filename, file_bytes, tmp_dir)
        except Exception:
            logger.exception("Pipeline failed for job %s", job_id)
            await self._update_job(job_id, {
                "status": "error",
                "error_message": "Processing failed. Please try again.",
                "updated_at": "now()",
            })
        finally:
            for p in tmp_dir.iterdir():
                p.unlink(missing_ok=True)
            tmp_dir.rmdir()

    async def _run_pipeline(
        self,
        job_id: str,
        filename: str,
        file_bytes: bytes,
        tmp_dir: Path,
    ) -> None:
        # 1. Write to temp file
        suffix = Path(filename).suffix or ".m4a"
        audio_path = tmp_dir / f"input{suffix}"
        audio_path.write_bytes(file_bytes)

        # 2. Compress if needed
        if len(file_bytes) > WHISPER_MAX_BYTES:
            logger.info("Job %s: compressing %.1f MB audio", job_id, len(file_bytes) / 1e6)
            compressed = tmp_dir / "compressed.m4a"
            self._compress_audio(audio_path, compressed)
            audio_path = compressed

        # 3. Transcription
        await self._update_job(job_id, {"status": "transcribing", "updated_at": "now()"})
        logger.info("Job %s: transcribing with Whisper", job_id)

        with audio_path.open("rb") as f:
            whisper_resp = await self._client.audio.transcriptions.create(
                model="whisper-1",
                file=(audio_path.name, f),
                response_format="verbose_json",
            )

        transcript = whisper_resp.text
        language = getattr(whisper_resp, "language", None)
        duration = getattr(whisper_resp, "duration", None)

        await self._update_job(job_id, {
            "status": "summarizing",
            "transcript": transcript,
            "language_detected": language,
            "duration_seconds": duration,
            "updated_at": "now()",
        })

        # 4. Summarization
        logger.info("Job %s: summarizing with GPT-4o", job_id)
        chat_resp = await self._client.chat.completions.create(
            model="gpt-4o",
            temperature=0.2,
            max_tokens=4000,
            messages=[
                {
                    "role": "user",
                    "content": SUMMARY_PROMPT.format(transcript=transcript),
                }
            ],
        )
        summary = chat_resp.choices[0].message.content or ""

        # 5. Store final result
        await self._update_job(job_id, {
            "status": "complete",
            "summary": summary,
            "updated_at": "now()",
        })
        logger.info("Job %s: complete", job_id)
