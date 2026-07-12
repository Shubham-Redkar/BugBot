from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

from db.base import Base
from db.tables import Finding, Scan, ScanError, ScanPage


def test_metadata_contains_expected_relational_tables():
    assert set(Base.metadata.tables) == {
        "projects",
        "scans",
        "scan_pages",
        "findings",
        "scan_errors",
    }


def test_scan_finding_fingerprint_is_unique_per_scan():
    constraints = {
        constraint.name
        for constraint in Finding.__table__.constraints
        if isinstance(constraint, UniqueConstraint)
    }

    assert "uq_scan_finding_fingerprint" in constraints


def test_foreign_keys_have_explicit_delete_behavior():
    assert next(iter(ScanPage.__table__.c.scan_id.foreign_keys)).ondelete == "CASCADE"
    assert next(iter(Finding.__table__.c.scan_id.foreign_keys)).ondelete == "CASCADE"
    assert next(iter(Finding.__table__.c.page_id.foreign_keys)).ondelete == "SET NULL"
    assert next(iter(ScanError.__table__.c.scan_id.foreign_keys)).ondelete == "CASCADE"


def test_postgres_schema_uses_jsonb_for_flexible_data():
    dialect = postgresql.dialect()
    scan_ddl = str(CreateTable(Scan.__table__).compile(dialect=dialect))
    finding_ddl = str(CreateTable(Finding.__table__).compile(dialect=dialect))

    assert "JSONB" in scan_ddl
    assert "JSONB" in finding_ddl


def test_alembic_has_one_initial_head():
    config = Config("alembic.ini")
    scripts = ScriptDirectory.from_config(config)

    assert scripts.get_heads() == ["20260712_01"]
