"""Create initial BugBot scan schema.

Revision ID: 20260712_01
Revises: None
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260712_01"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


scan_status = postgresql.ENUM(
    "pending",
    "running",
    "completed",
    "completed_with_errors",
    "failed",
    name="scan_status",
    create_type=False,
)
page_status = postgresql.ENUM(
    "pending", "scanned", "failed", "timed_out", name="page_status", create_type=False
)
finding_severity = postgresql.ENUM(
    "critical",
    "high",
    "medium",
    "low",
    "unknown",
    name="finding_severity",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    scan_status.create(bind, checkfirst=True)
    page_status.create(bind, checkfirst=True)
    finding_severity.create(bind, checkfirst=True)

    op.create_table(
        "projects",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("base_url", sa.String(length=2048), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "scans",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=True),
        sa.Column("target_url", sa.String(length=2048), nullable=False),
        sa.Column("status", scan_status, nullable=False),
        sa.Column("health_score", sa.Integer(), nullable=True),
        sa.Column("health_status", sa.String(length=50), nullable=True),
        sa.Column("pages_discovered", sa.Integer(), nullable=False),
        sa.Column("pages_scanned", sa.Integer(), nullable=False),
        sa.Column("pages_failed", sa.Integer(), nullable=False),
        sa.Column("issues_found", sa.Integer(), nullable=False),
        sa.Column("summary", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scans_project_id", "scans", ["project_id"])
    op.create_index("ix_scans_status", "scans", ["status"])
    op.create_table(
        "scan_pages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("scan_id", sa.Uuid(), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("source_url", sa.String(length=2048), nullable=True),
        sa.Column("depth", sa.Integer(), nullable=False),
        sa.Column("status", page_status, nullable=False),
        sa.Column("title", sa.String(length=500), nullable=True),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["scan_id"], ["scans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("scan_id", "url", name="uq_scan_page_url"),
    )
    op.create_index("ix_scan_pages_scan_id", "scan_pages", ["scan_id"])
    op.create_table(
        "findings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("scan_id", sa.Uuid(), nullable=False),
        sa.Column("page_id", sa.Uuid(), nullable=True),
        sa.Column("rule_id", sa.String(length=200), nullable=False),
        sa.Column("issue_type", sa.String(length=200), nullable=False),
        sa.Column("severity", finding_severity, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("selector", sa.Text(), nullable=True),
        sa.Column("evidence", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("screenshot_path", sa.String(length=2048), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("impact", sa.Text(), nullable=True),
        sa.Column("fix_suggestion", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("fingerprint", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["page_id"], ["scan_pages.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["scan_id"], ["scans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("scan_id", "fingerprint", name="uq_scan_finding_fingerprint"),
    )
    op.create_index("ix_findings_page_id", "findings", ["page_id"])
    op.create_index("ix_findings_scan_id", "findings", ["scan_id"])
    op.create_index("ix_findings_severity", "findings", ["severity"])
    op.create_index("ix_findings_scan_severity", "findings", ["scan_id", "severity"])
    op.create_table(
        "scan_errors",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("scan_id", sa.Uuid(), nullable=False),
        sa.Column("stage", sa.String(length=100), nullable=False),
        sa.Column("page_url", sa.String(length=2048), nullable=True),
        sa.Column("rule_id", sa.String(length=200), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["scan_id"], ["scans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scan_errors_scan_id", "scan_errors", ["scan_id"])


def downgrade() -> None:
    op.drop_table("scan_errors")
    op.drop_table("findings")
    op.drop_table("scan_pages")
    op.drop_table("scans")
    op.drop_table("projects")

    bind = op.get_bind()
    finding_severity.drop(bind, checkfirst=True)
    page_status.drop(bind, checkfirst=True)
    scan_status.drop(bind, checkfirst=True)
