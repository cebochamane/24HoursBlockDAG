"""init leaderboard

Revision ID: 20250927_000001
Revises: 
Create Date: 2025-09-27 12:15:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250927_000001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'leaderboard',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_address', sa.String(length=42), nullable=False),
        sa.Column('accuracy_score', sa.Float(), nullable=False),
        sa.Column('total_predictions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_error', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_leaderboard_user_address', 'leaderboard', ['user_address'])


def downgrade() -> None:
    op.drop_index('ix_leaderboard_user_address', table_name='leaderboard')
    op.drop_table('leaderboard')
