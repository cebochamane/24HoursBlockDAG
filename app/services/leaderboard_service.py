import random
from datetime import datetime
from app.utils.logger import logger
from app.db.session import SessionLocal
from app.db.models import LeaderboardEntry


class LeaderboardService:
    async def get_leaderboard(self):
        # query top leaderboard entries by accuracy_score desc, then total_predictions desc
        with SessionLocal() as db:
            q = (
                db.query(LeaderboardEntry)
                .order_by(LeaderboardEntry.accuracy_score.desc(), LeaderboardEntry.total_predictions.desc())
                .limit(50)
            )
            rows = q.all()

            # seed demo data if empty
            if not rows:
                self._seed(db)
                rows = (
                    db.query(LeaderboardEntry)
                    .order_by(LeaderboardEntry.accuracy_score.desc(), LeaderboardEntry.total_predictions.desc())
                    .limit(50)
                    .all()
                )

            entries = []
            for rank, r in enumerate(rows, start=1):
                entries.append(
                    {
                        "rank": rank,
                        "user_address": r.user_address,
                        "accuracy_score": round(float(r.accuracy_score), 3),
                        "total_predictions": int(r.total_predictions),
                        "avg_error": round(float(r.avg_error), 2),
                    }
                )

        return {
            "entries": entries,
            "total_players": len(entries),
            "updated_at": datetime.utcnow(),
        }

    def _seed(self, db):
        addresses = [
            "0x74232704659A37D66D6a334eF3E087eF6c139414",
            "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
            "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
        ]
        for i, addr in enumerate(addresses, 1):
            db.add(
                LeaderboardEntry(
                    user_address=addr,
                    accuracy_score=0.95 - (i - 1) * 0.1,
                    total_predictions=random.randint(5, 30),
                    avg_error=100 + i * 20,
                )
            )
        db.commit()


leaderboard = LeaderboardService()
