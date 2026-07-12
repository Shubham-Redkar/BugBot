import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class AnalysisResult:
    findings: list[dict[str, Any]]
    health_score: int
    summary: dict[str, int]
    health_status: str


def finding_fingerprint(finding: dict[str, Any]) -> str:
    """Build a stable identity from the finding and its collected evidence."""
    evidence = finding.get("evidence")
    if not isinstance(evidence, dict):
        evidence = {}

    identity = {
        "rule_id": finding.get("rule_id") or finding.get("issue_type", ""),
        "page": finding.get("page", ""),
        "description": finding.get("description", ""),
        "selector": evidence.get("selector"),
        "resource_url": evidence.get("resource_url"),
        "console_message": evidence.get("console_message"),
        "console_messages": evidence.get("console_messages"),
    }
    encoded = json.dumps(identity, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def deduplicate_findings(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []

    for finding in findings:
        fingerprint = finding_fingerprint(finding)
        if fingerprint in seen:
            continue

        seen.add(fingerprint)
        normalized = dict(finding)
        normalized["fingerprint"] = fingerprint
        unique.append(normalized)

    return unique


def extract_count(description: str) -> int:
    match = re.search(r"(\d+)", description or "")
    return int(match.group(1)) if match else 1


def calculate_health_score(
    findings: list[dict[str, Any]], pages_scanned: int
) -> tuple[int, dict[str, int], str]:
    summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "unknown": 0}
    weights = {"critical": 20, "high": 12, "medium": 5, "low": 2, "unknown": 2}
    total_penalty = 0.0

    for finding in findings:
        severity = str(finding.get("severity", "unknown")).lower()
        if severity not in summary:
            severity = "unknown"

        summary[severity] += 1
        count_factor = min(extract_count(str(finding.get("description", ""))), 10)
        total_penalty += weights[severity] + count_factor * 0.5

    score = int(max(0, min(100, 100 - total_penalty / max(pages_scanned, 1))))
    status = (
        "Excellent"
        if score >= 90
        else "Good"
        if score >= 75
        else "Fair"
        if score >= 55
        else "Poor"
    )
    return score, summary, status


def analyze_findings(
    findings: list[dict[str, Any]], pages_scanned: int
) -> AnalysisResult:
    unique = deduplicate_findings(findings)
    priority = {"critical": 0, "high": 1, "medium": 2, "low": 3, "unknown": 4}
    ordered = sorted(
        unique,
        key=lambda finding: priority.get(
            str(finding.get("severity", "unknown")).lower(), 4
        ),
    )
    score, summary, status = calculate_health_score(ordered, pages_scanned)
    return AnalysisResult(
        findings=ordered,
        health_score=score,
        summary=summary,
        health_status=status,
    )
