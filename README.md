# Backend Ledger

A financial transaction system built with Node.js, Express, TypeScript, and MongoDB. Implements a ledger-based architecture where account balances are derived from transaction history rather than stored directly.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Atlas)
- **ODM**: Mongoose
- **Auth**: JWT
- **Email**: Nodemailer
- **Env**: dotenvx

## Project Structure

```
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── types/
├── app.ts
└── server.ts
```

## Architecture

### Ledger-Based Balance

Account balances are never stored directly. Balance is derived at query time by aggregating all ledger entries:

```
balance = sum(CREDIT entries) - sum(DEBIT entries)
```

Every transaction creates two ledger entries — a DEBIT on the sender and a CREDIT on the receiver.

### 10-Step Transfer Flow

1. Validate request fields
2. Idempotency key check
3. Check both accounts are ACTIVE
4. Derive sender balance from ledger
5. Create transaction (PENDING)
6. Create DEBIT ledger entry
7. Create CREDIT ledger entry
8. Mark transaction COMPLETED
9. Commit MongoDB session
10. Send email notification

Steps 5–9 run inside a MongoDB session for atomicity.

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/accounts/` | Create account for logged-in user |
| GET | `/api/accounts/` | Get all accounts of logged-in user |
| GET | `/api/accounts/balance/:accountId` | Get account balance |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions/` | Transfer funds between accounts |
| POST | `/api/transactions/system/initial-funds` | Seed initial funds to an account |

## Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### Installation

```bash
git clone <repo-url>
cd BACKEND-LEDGER
npm install
```

### Environment Variables

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

### Run

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## Idempotency

Every transaction requires a unique `idempotencyKey` (UUID). Retrying with the same key returns the existing transaction instead of creating a duplicate.

| Status | Behaviour on retry |
|--------|-------------------|
| COMPLETED | Returns 200 with existing transaction |
| PENDING | Returns 200 with processing message |
| FAILED / REVERSED | Returns 500, safe to retry with new key |
