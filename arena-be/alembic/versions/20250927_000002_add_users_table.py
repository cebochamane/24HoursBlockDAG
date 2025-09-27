"""add users table

Revision ID: 20250927_000002
Revises: 20250927_000001
Create Date: 2025-09-27 12:40:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250927_000002'
down_revision = '20250927_000001'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_address', sa.String(length=42), nullable=False),
        sa.Column('nickname', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('user_address', name='uq_users_user_address'),
    )
    op.create_index('ix_users_user_address', 'users', ['user_address'])


def downgrade() -> None:
    op.drop_index('ix_users_user_address', table_name='users')
    op.drop_table('users')
