"""Create bookings and prevent overlapping rentals in PostgreSQL."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ExcludeConstraint

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")
    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("car_id", sa.Integer(), sa.ForeignKey("cars.id"), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(9), nullable=False, server_default="pending"),
        sa.Column("billed_hours", sa.Integer(), nullable=False),
        sa.Column("hourly_price", sa.Integer(), nullable=False),
        sa.Column("daily_price", sa.Integer(), nullable=False),
        sa.Column("subtotal", sa.BigInteger(), nullable=False),
        sa.Column("discount_percent", sa.Integer(), nullable=False),
        sa.Column("total_price", sa.BigInteger(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.CheckConstraint("ends_at > starts_at", name="booking_period"),
        sa.CheckConstraint("billed_hours > 0", name="booking_hours"),
        sa.CheckConstraint("hourly_price > 0 AND daily_price > 0", name="booking_rates"),
        sa.CheckConstraint("discount_percent IN (0, 10, 20)", name="booking_discount"),
        sa.CheckConstraint("subtotal > 0 AND total_price >= 0", name="booking_amounts"),
        sa.CheckConstraint(
            "status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')",
            name="bookingstatus",
        ),
        ExcludeConstraint(
            ("car_id", "="),
            (sa.text("tstzrange(starts_at, ends_at, '[)')"), "&&"),
            where=sa.text("status IN ('pending', 'confirmed')"),
            using="gist",
            name="bookings_no_overlap",
        ),
    )
    op.create_index("ix_bookings_user_created", "bookings", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_table("bookings")
