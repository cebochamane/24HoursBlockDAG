import numpy as np
from sklearn.linear_model import LinearRegression
from app.utils.logger import logger
import random

class MLService:
    def __init__(self):
        self.model = LinearRegression()
        self._train()

    def _train(self):
        # 100-day synthetic trend
        X = np.arange(100).reshape(-1, 1)
        y = 2200 + 4 * np.arange(100) + np.random.normal(0, 50, 100)
        self.model.fit(X, y)
        logger.info("ML model trained")

    async def predict_future_price(self, days_ahead: int = 7) -> float:
        future_day = np.array([[100 + days_ahead]])
        pred = self.model.predict(future_day)[0]
        # add realistic noise
        pred += random.uniform(-100, 100)
        return max(100.0, round(float(pred), 2))

ml = MLService()
