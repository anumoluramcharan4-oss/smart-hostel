"""create staff table

Revision ID: 666b458f3e0f
Revises: 67e3f9d7c7b3
Create Date: 2026-11-03 11:09:10.570148

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '666b458f3e0f'
down_revision: Union[str, Sequence[str], None] = '67e3f9d7c7b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "staff" not in tables:
        op.create_table(
            "staff",
            sa.Column("id", sa.String(), primary_key=True, nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("phone", sa.String(), nullable=False, unique=True),
            sa.Column("trade", sa.String(), nullable=False),
            sa.Column("status", sa.String(), nullable=False, server_default="active"),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
        op.create_index(op.f("ix_staff_trade"), "staff", ["trade"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if "staff" in tables:
        op.drop_index(op.f("ix_staff_trade"), table_name="staff")
        op.drop_table("staff")
