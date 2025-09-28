# Arena Frontend (arena-fe)

Vite/React frontend for the Arena prediction market. Users can place YES/NO bets, request AI advice, and see outcomes with notifications.

## Features
- **Predict and Bet**: Place YES/NO bets with a ZAR amount on ETH markets.
- **AI Advice**: Calls backend `/api/v1/predict` to show reasoning and a demo AI-bot tx.
- **Market Status**: Badges show `Open`, `Closed`, or `Resolved`. When resolved, displays `Outcome: YES/NO`.
- **My Bets**: Lists your bets with `status` (pending/won/lost) and `payout_amount`.
- **Notifications**: Toasts trigger when a bet transitions from pending → won/lost.
- **Guest Mode**: If no wallet is installed, a persistent guest address is generated for a web3-like flow without signing.

## Getting Started

Recommended: run the full stack via root compose. See `RUNBOOK.md` and root `Makefile` for shortcuts.

### Local frontend-only dev (optional)
```bash
cd arena-fe
npm install
npm run dev   # http://localhost:5173
```

The frontend expects the backend at `http://localhost:8001`. Update API base in `src/lib/api.js` if needed.

## Key Components
- `src/components/BetBox.jsx`
  - Shows market card, deadlines, status/outcome badges, YES/NO controls, amount.
  - Persists bet, then calls `/predict` to render AI reasoning and demo tx.
- `src/components/MyBets.jsx`
  - Polls `/api/v1/users/{address}/bets` every 15s and lists bets with status and payouts.
  - Emits toasts when a bet becomes won/lost.
- `src/components/Toasts.jsx`
  - Visual overlay for notifications.
- `src/lib/api.js`
  - Wrapper for backend endpoints (`getMarkets`, `createBet`, `getUserBets`, etc.).
- `src/lib/web3.js`
  - Wallet connect helper with guest mode fallback (`guest_address_v1`).
- `src/lib/toast.js`
  - Minimal pub/sub toast bus (`addToast`, `subscribe`).

## How It Integrates
- Fetches markets from backend: `GET /api/v1/markets`.
- Records bets: `POST /api/v1/markets/{id}/bets`.
- Gets AI advice: `POST /api/v1/predict`.
- Polls user bets for outcomes: `GET /api/v1/users/{address}/bets`.

## Troubleshooting
- No markets render: ensure backend is running and reachable at `:8001`.
- No notifications: confirm `Toasts` is mounted in `src/App.jsx` and that `MyBets` is visible on the page.
- CORS errors: set `ALLOWED_ORIGINS` in backend `.env` or use dev compose (which handles CORS for local).

## License
For internal/demo use; see repository root for overall project licensing.
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
