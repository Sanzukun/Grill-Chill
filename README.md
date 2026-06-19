# 🔥 Grill & Chill — Cafe Food Ordering App

> **Cafe on Street, Kulti** — A full-stack food ordering PWA with wallet rewards, referral system, and owner dashboard.

---

## Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Backend    | Python · FastAPI · SQLAlchemy |
| Database   | PostgreSQL (Railway)          |
| Migrations | Alembic                       |
| Frontend   | HTML · CSS · Vanilla JS       |
| Hosting BE | Railway                       |
| Hosting FE | Cloudflare Pages              |

---

## Project Structure

```
grill-and-chill/
├── backend/
│   ├── main.py          # FastAPI app entry point
│   ├── database.py      # SQLAlchemy engine + session
│   ├── models.py        # ORM models (users, orders, wallet…)
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── crud.py          # Database operations
│   ├── services.py      # Business logic (wallet, rewards)
│   ├── auth.py          # Password hashing, session utils
│   ├── settings.py      # Environment config
│   ├── seed.py          # Menu seed data
│   ├── requirements.txt
│   ├── alembic.ini
│   └── alembic/
│       ├── env.py
│       └── versions/
│           └── 001_initial_schema.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── _redirects       # Cloudflare Pages SPA routing
│   └── pages/
│       ├── auth.js
│       ├── home.js
│       ├── cart.js
│       ├── orders.js
│       ├── wallet.js
│       ├── profile.js
│       └── owner.js
├── .env.example
└── README.md
```

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- PostgreSQL (local or Railway)
- Any static file server (VS Code Live Server, Python http.server, etc.)

### 1. Clone and setup backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp ../.env.example .env
# Edit .env — at minimum set DATABASE_URL
```

### 3. Run database migrations

```bash
# Make sure DATABASE_URL is set in .env
alembic upgrade head
```

### 4. Seed menu data

```bash
python seed.py
```

### 5. Start the backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

### 6. Start the frontend

```bash
cd ../frontend
python -m http.server 3000
# Open http://localhost:3000
```

> **Important:** Set `window.API_BASE` in `frontend/app.js` to `http://localhost:8000` for local dev.

---

## Environment Variables

| Variable              | Description                                      | Example                          |
|-----------------------|--------------------------------------------------|----------------------------------|
| `DATABASE_URL`        | PostgreSQL connection string                     | `postgresql://user:pass@host/db` |
| `SECRET_KEY`          | Long random string (not currently used for JWT)  | `abc123...`                      |
| `OWNER_USERNAME`      | Owner login username                             | `owner`                          |
| `OWNER_PASSWORD`      | Owner login password                             | `GrillChill@2024`                |
| `OWNER_SESSION_TOKEN` | Long random string used as owner bearer token    | `xyz789...`                      |
| `ALLOWED_ORIGINS`     | Comma-separated CORS origins                     | `https://yoursite.pages.dev`     |
| `REWARD_PERCENTAGE`   | Wallet reward % of order (default: 0.10 = 10%)  | `0.10`                           |
| `BUYER_REWARD_RATIO`  | Buyer's share of reward pool (default: 0.75)     | `0.75`                           |
| `REFERRER_REWARD_RATIO`| Referrer's share (default: 0.25)                | `0.25`                           |
| `ORDER_PREFIX`        | Order number prefix                              | `GC`                             |
| `ORDER_START`         | First order number                               | `1001`                           |
| `SESSION_EXPIRE_DAYS` | User session expiry (default: 30)                | `30`                             |

---

## Railway Deployment (Backend)

### 1. Create Railway project

1. Go to [railway.app](https://railway.app) → New Project
2. Add **PostgreSQL** plugin → copy `DATABASE_URL`
3. Add a new **Service** → connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Set **Start Command** to:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### 2. Add environment variables in Railway

Go to your service → Variables → add all variables from `.env.example`.

Generate secure values:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```
Use this for `SECRET_KEY` and `OWNER_SESSION_TOKEN`.

### 3. Run migrations on Railway

In Railway service → **New Run**:
```
alembic upgrade head
```

Then run seed:
```
python seed.py
```

Or set them as a **Deploy Command** (runs once after each deploy):
```
alembic upgrade head && python seed.py
```

---

## Cloudflare Pages Deployment (Frontend)

### 1. Update API base URL

In `frontend/app.js`, line 9 — set your Railway backend URL:
```js
window.API_BASE = 'https://your-backend.up.railway.app';
```

### 2. Deploy to Cloudflare Pages

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your GitHub repository
3. Set **Build output directory** to `frontend`
4. Set **Build command** to (leave blank — no build step needed)
5. Deploy!

The `frontend/_redirects` file handles SPA routing automatically.

---

## Database Migration Guide

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration (after model changes)
alembic revision --autogenerate -m "describe your change"

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# View current revision
alembic current
```

---

## API Endpoints

### Authentication
| Method | Endpoint              | Auth     | Description          |
|--------|-----------------------|----------|----------------------|
| POST   | `/auth/register`      | None     | Create account       |
| POST   | `/auth/login`         | None     | Login                |
| POST   | `/auth/logout`        | User     | Logout               |
| POST   | `/auth/owner/login`   | None     | Owner login          |

### Users
| Method | Endpoint    | Auth | Description  |
|--------|-------------|------|--------------|
| GET    | `/users/me` | User | Get profile  |

### Products
| Method | Endpoint         | Auth | Description            |
|--------|------------------|------|------------------------|
| GET    | `/products/menu` | None | Get full menu          |

### Orders
| Method | Endpoint          | Auth | Description        |
|--------|-------------------|------|--------------------|
| POST   | `/orders/`        | User | Place order        |
| GET    | `/orders/`        | User | Order history      |
| GET    | `/orders/{id}`    | User | Order detail       |

### Wallet
| Method | Endpoint    | Auth | Description               |
|--------|-------------|------|---------------------------|
| GET    | `/wallet/`  | User | Balance + transactions    |

### Owner Dashboard
| Method | Endpoint                          | Owner | Description         |
|--------|-----------------------------------|-------|---------------------|
| GET    | `/owner/stats`                    | Yes   | Dashboard stats     |
| GET    | `/owner/orders/pending`           | Yes   | Pending orders      |
| GET    | `/owner/orders`                   | Yes   | All orders          |
| POST   | `/owner/orders/{id}/approve`      | Yes   | Approve order       |
| POST   | `/owner/orders/{id}/reject`       | Yes   | Reject order        |

---

## Reward Logic

```
Order Amount = ₹200

Reward Pool = ₹200 × 10% = ₹20

If buyer has referrer:
  Buyer gets   ₹20 × 75% = ₹15
  Referrer gets ₹20 × 25% = ₹5

If buyer has NO referrer:
  Buyer gets entire ₹20

Wallet deduction example:
  Wallet Balance = ₹30
  Cart Total     = ₹120
  Payable        = ₹90  (₹30 deducted)
  Wallet becomes = ₹0
```

Rewards are credited **only after owner approves** the order.
If order is rejected, any wallet deducted is **refunded**.

---

## Owner Dashboard

Access at: `yoursite.pages.dev/#owner`

Default credentials (set in `.env`):
```
Username: owner
Password: GrillChill@2024
```

**Change these in production!**

Owner can:
- View all stats (users, revenue, rewards)
- See pending orders with customer details
- Override the final amount before approval
- Approve or reject orders
- View full order history

---

## Security Notes

- Passwords are bcrypt-hashed (12 rounds)
- Sessions use cryptographically secure random tokens
- Owner credentials are stored only in environment variables
- CORS is configured per `ALLOWED_ORIGINS`
- Input validation on all endpoints via Pydantic
- Never commit `.env` to version control

---

## Support

For issues, check:
1. Backend logs on Railway
2. Browser console for frontend errors
3. FastAPI docs at `/docs` for API testing
