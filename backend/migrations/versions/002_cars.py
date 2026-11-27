"""Create the car catalog."""

import sqlalchemy as sa
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cars",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("brand", sa.String(60), nullable=False),
        sa.Column("model", sa.String(60), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("car_class", sa.String(7), nullable=False),
        sa.Column("transmission", sa.String(9), nullable=False),
        sa.Column("seats", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(2048), nullable=False),
        sa.Column("hourly_price", sa.Integer(), nullable=False),
        sa.Column("daily_price", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.CheckConstraint("year BETWEEN 1900 AND 2100", name="car_year"),
        sa.CheckConstraint("seats BETWEEN 1 AND 9", name="car_seats"),
        sa.CheckConstraint("hourly_price > 0 AND daily_price > 0", name="car_prices"),
        sa.CheckConstraint("car_class IN ('economy', 'comfort', 'suv')", name="carclass"),
        sa.CheckConstraint("transmission IN ('automatic', 'manual')", name="transmission"),
    )


def downgrade() -> None:
    op.drop_table("cars")
