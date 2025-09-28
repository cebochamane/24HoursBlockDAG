export class ApiClient {
  constructor() {
    const envUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
    const loc = typeof window !== 'undefined' ? window.location : null;
    const sameHost = loc ? `${loc.protocol}//${loc.hostname}:8001` : undefined;
    this.candidates = [
      envUrl,
      sameHost,
      'http://localhost:8001',
      'http://127.0.0.1:8001',
    ].filter(Boolean);
    this.baseURL = this.candidates[0];
    try { console.log('[ApiClient] baseURL candidates =', this.candidates); } catch {}
  }

  async _json(resp) {
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }
    return resp.json();
  }

  async _request(path, init) {
    let lastErr;
    for (const base of this.candidates) {
      try {
        const resp = await fetch(`${base}${path}`, init);
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          throw new Error(`HTTP ${resp.status}: ${text}`);
        }
        // cache working base
        this.baseURL = base;
        return resp.json();
      } catch (e) {
        lastErr = e;
        // try next candidate on network failure
        continue;
      }
    }
    throw lastErr || new Error('Network error');
  }

  async healthCheck() { return this._request(`/health`); }

  async getPriceData() { return this._request(`/api/v1/price`); }

  async submitPrediction(userAddress, predictionValue) {
    return this._request(`/api/v1/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_address: userAddress, prediction_value: predictionValue }),
    });
  }

  async getLeaderboard() { return this._request(`/api/v1/leaderboard`); }

  async getChainInfo() { return this._request(`/api/v1/chain/info`); }

  async getContractAbi() { return this._request(`/api/v1/chain/abi`); }

  async chat(prompt) {
    return this._request(`/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
  }

  async getMarkets() {
    return this._request(`/api/v1/markets`);
  }

  async createBet(marketId, { side, amount, userAddress }) {
    return this._request(`/api/v1/markets/${marketId}/bets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ side, amount, user_address: userAddress }),
    });
  }

  async getUserBets(userAddress) {
    return this._request(`/api/v1/users/${userAddress}/bets`);
  }
}

export const apiClient = new ApiClient();
