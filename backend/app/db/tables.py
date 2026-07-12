from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class ScanStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    COMPLETED_WITH_ERRORS = "completed_with_errors"
    FAILED = "failed"


class PageStatus(StrEnum):
    PENDING = "pending"
    SCANNED = "scanned"
    FAILED = "failed"
    TIMED_OUT = "timed_out"


class Severity(StrEnum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200))
    base_url: Mapped[str] = mapped_column(String(2048))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    scans: Mapped[list["Scan"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    project_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True
    )
    target_url: Mapped[str] = mapped_column(String(2048))
    status: Mapped[ScanStatus] = mapped_column(
        Enum(
            ScanStatus,
            name="scan_status",
            values_callable=lambda enum: [item.value for item in enum],
        ),
        default=ScanStatus.PENDING,
        index=True,
    )
    health_score: Mapped[int | None] = mapped_column(Integer)
    health_status: Mapped[str | None] = mapped_column(String(50))
    pages_discovered: Mapped[int] = mapped_column(Integer, default=0)
    pages_scanned: Mapped[int] = mapped_column(Integer, default=0)
    pages_failed: Mapped[int] = mapped_column(Integer, default=0)
    issues_found: Mapped[int] = mapped_column(Integer, default=0)
    summary: Mapped[dict[str, int]] = mapped_column(JSONB, default=dict)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[float | None] = mapped_column(Float)

    project: Mapped[Project | None] = relationship(back_populates="scans")
    pages: Mapped[list["ScanPage"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )
    findings: Mapped[list["Finding"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )
    errors: Mapped[list["ScanError"]] = relationship(
        back_populates="scan", cascade="all, delete-orphan"
    )


class ScanPage(Base):
    __tablename__ = "scan_pages"
    __table_args__ = (UniqueConstraint("scan_id", "url", name="uq_scan_page_url"),)

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    scan_id: Mapped[UUID] = mapped_column(
        ForeignKey("scans.id", ondelete="CASCADE"), index=True
    )
    url: Mapped[str] = mapped_column(String(2048))
    source_url: Mapped[str | None] = mapped_column(String(2048))
    depth: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[PageStatus] = mapped_column(
        Enum(
            PageStatus,
            name="page_status",
            values_callable=lambda enum: [item.value for item in enum],
        ),
        default=PageStatus.PENDING,
    )
    title: Mapped[str | None] = mapped_column(String(500))
    http_status: Mapped[int | None] = mapped_column(Integer)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    error: Mapped[str | None] = mapped_column(Text)

    scan: Mapped[Scan] = relationship(back_populates="pages")
    findings: Mapped[list["Finding"]] = relationship(back_populates="page")


class Finding(Base):
    __tablename__ = "findings"
    __table_args__ = (
        UniqueConstraint("scan_id", "fingerprint", name="uq_scan_finding_fingerprint"),
        Index("ix_findings_scan_severity", "scan_id", "severity"),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    scan_id: Mapped[UUID] = mapped_column(
        ForeignKey("scans.id", ondelete="CASCADE"), index=True
    )
    page_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("scan_pages.id", ondelete="SET NULL"), nullable=True, index=True
    )
    rule_id: Mapped[str] = mapped_column(String(200))
    issue_type: Mapped[str] = mapped_column(String(200))
    severity: Mapped[Severity] = mapped_column(
        Enum(
            Severity,
            name="finding_severity",
            values_callable=lambda enum: [item.value for item in enum],
        ),
        index=True,
    )
    description: Mapped[str] = mapped_column(Text)
    selector: Mapped[str | None] = mapped_column(Text)
    evidence: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    screenshot_path: Mapped[str | None] = mapped_column(String(2048))
    explanation: Mapped[str | None] = mapped_column(Text)
    impact: Mapped[str | None] = mapped_column(Text)
    fix_suggestion: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[float | None] = mapped_column(Float)
    fingerprint: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    scan: Mapped[Scan] = relationship(back_populates="findings")
    page: Mapped[ScanPage | None] = relationship(back_populates="findings")


class ScanError(Base):
    __tablename__ = "scan_errors"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    scan_id: Mapped[UUID] = mapped_column(
        ForeignKey("scans.id", ondelete="CASCADE"), index=True
    )
    stage: Mapped[str] = mapped_column(String(100))
    page_url: Mapped[str | None] = mapped_column(String(2048))
    rule_id: Mapped[str | None] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    scan: Mapped[Scan] = relationship(back_populates="errors")
