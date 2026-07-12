import pytest
from pydantic import ValidationError

from models import Finding, FindingEvidence


def test_finding_collects_structured_evidence():
    finding = Finding(
        rule_id="assets.broken_image",
        page="https://example.com/products",
        issue_type="Broken Images",
        severity="High",
        description="One product image failed to load.",
        evidence=FindingEvidence(
            selector="main img",
            resource_url="https://example.com/missing.png",
            http_status=404,
        ),
        confidence=0.95,
    )

    assert finding.evidence.http_status == 404
    assert finding.evidence.resource_url.endswith("missing.png")
    assert finding.confidence == 0.95


@pytest.mark.parametrize("confidence", [-0.01, 1.01])
def test_finding_rejects_confidence_outside_unit_interval(confidence):
    with pytest.raises(ValidationError):
        Finding(
            rule_id="metadata.missing_title",
            page="https://example.com",
            issue_type="Missing Page Title",
            severity="Medium",
            description="The page title is empty.",
            confidence=confidence,
        )


def test_finding_evidence_defaults_are_not_shared():
    first = Finding(
        rule_id="one",
        page="https://example.com/one",
        issue_type="First",
        severity="Low",
        description="First finding",
    )
    second = Finding(
        rule_id="two",
        page="https://example.com/two",
        issue_type="Second",
        severity="Low",
        description="Second finding",
    )

    first.evidence.details["value"] = 1

    assert second.evidence.details == {}
