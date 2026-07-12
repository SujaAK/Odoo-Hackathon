# 🚛 TransitOps — Smart Transport Operations Platform

A full-stack web application that digitizes vehicle, driver, dispatch, maintenance, and expense management with real-time operational insights.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | JWT + Firebase (Google Auth) |
| Deployment | Vercel (Frontend) + Render (Backend) |

---

## 📁 Project Structure

```
transitops/
├── client/                  # React Frontend
│   └── src/
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Vehicles.tsx
│       │   ├── Drivers.tsx
│       │   ├── Trips.tsx
│       │   ├── Maintenance.tsx
│       │   ├── FuelExpense.tsx
│       │   ├── Reports.tsx
│       │   └── Settings.tsx
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── Sidebar.tsx
│       │   └── KPICard.tsx
│       ├── lib/
│       │   └── axios.ts
│       ├── context/
│       │   └── AuthContext.tsx
│       └── types/
│           └── index.ts
│
└── server/                  # Node.js Backend
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    ├── src/
    │   ├── controllers/
    │   │   ├── auth.controller.ts
    │   │   ├── vehicle.controller.ts
    │   │   ├── driver.controller.ts
    │   │   ├── trip.controller.ts
    │   │   ├── maintenance.controller.ts
    │   │   └── fuel.controller.ts
    │   ├── routes/
    │   │   ├── auth.routes.ts
    │   │   ├── vehicle.routes.ts
    │   │   ├── driver.routes.ts
    │   │   ├── trip.routes.ts
    │   │   ├── maintenance.routes.ts
    │   │   └── fuel.routes.ts
    │   ├── middleware/
    │   │   ├── auth.middleware.ts
    │   │   └── rbac.middleware.ts
    │   ├── lib/
    │   │   ├── prisma.ts
    │   │   └── firebase-admin.ts
    │   └── index.ts
    ├── prisma.config.ts
    └── .env
```

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| **Fleet Manager** | Full access — vehicles, drivers, maintenance, reports |
| **Driver** | Create & manage trips, view assigned vehicles |
| **Safety Officer** | View drivers, license compliance, safety scores |
| **Financial Analyst** | View fuel logs, expenses, reports, ROI |

> ⚠️ Only Fleet Manager can register new drivers. Drivers cannot self-register.

---

## 🗄️ Database Models

- **User** — Authentication and role management
- **Vehicle** — Fleet registry with lifecycle status
- **Driver** — Driver profiles with license tracking
- **Trip** — Trip lifecycle management
- **MaintenanceLog** — Vehicle maintenance records
- **FuelLog** — Fuel consumption tracking
- **Expense** — Operational expense tracking

---

## 🔄 Vehicle Status Flow

```
AVAILABLE → ON_TRIP → AVAILABLE
AVAILABLE → IN_SHOP → AVAILABLE
AVAILABLE → RETIRED
```

## 🔄 Driver Status Flow

```
AVAILABLE → ON_TRIP → AVAILABLE
AVAILABLE → OFF_DUTY
AVAILABLE → SUSPENDED
```

## 🔄 Trip Status Flow

```
DRAFT → DISPATCHED → COMPLETED
DRAFT → CANCELLED
DISPATCHED → CANCELLED
```

---

## ⚙️ Business Rules

- Retired/In Shop vehicles **never** appear in dispatch
- Suspended drivers **cannot** be assigned to trips
- Drivers with **expired licenses** are blocked from dispatch
- Same vehicle/driver **cannot** be on 2 active trips simultaneously
- Cargo weight **must not exceed** vehicle max load capacity
- Dispatching a trip → vehicle + driver status = **ON_TRIP**
- Completing a trip → vehicle + driver status = **AVAILABLE**
- Cancelling a dispatched trip → vehicle + driver status = **AVAILABLE**
- Creating maintenance → vehicle status = **IN_SHOP**
- Closing maintenance → vehicle status = **AVAILABLE**

---

## 🛠️ Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL (via Supabase/Neon)
- npm

### 1. Clone the repo
```bash
git clone https://github.com/SujaAK/Odoo-Hackathon.git
cd Odoo-Hackathon
```

### 2. Setup Server
```bash
cd server
npm install
```

Create `server/.env`:
```env
DATABASE_URL="your-supabase-pooler-url"
DIRECT_URL="your-supabase-direct-url"
JWT_SECRET="your-jwt-secret"
PORT=5000
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
```

Push database schema:
```bash
npx prisma db push
```

Start server:
```bash
npm run dev
```

### 3. Setup Client
```bash
cd ../client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

Start client:
```bash
npm run dev
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |

### Vehicles
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/vehicles` | All roles |
| POST | `/api/vehicles` | Fleet Manager |
| PUT | `/api/vehicles/:id` | Fleet Manager |
| DELETE | `/api/vehicles/:id` | Fleet Manager |
| GET | `/api/vehicles/available` | Driver, Fleet Manager |

### Drivers
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/drivers` | Fleet Manager, Safety Officer |
| POST | `/api/drivers` | Fleet Manager |
| PUT | `/api/drivers/:id` | Fleet Manager, Safety Officer |
| GET | `/api/drivers/available` | Driver, Fleet Manager |

### Trips
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/trips` | All roles |
| POST | `/api/trips` | Driver, Fleet Manager |
| PUT | `/api/trips/:id/dispatch` | Driver, Fleet Manager |
| PUT | `/api/trips/:id/complete` | Driver, Fleet Manager |
| PUT | `/api/trips/:id/cancel` | Driver, Fleet Manager |

### Maintenance
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/maintenance` | Fleet Manager, Safety Officer |
| POST | `/api/maintenance` | Fleet Manager |
| PUT | `/api/maintenance/:id/close` | Fleet Manager |

### Fuel & Expenses
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/fuel` | Fleet Manager, Financial Analyst |
| POST | `/api/fuel` | Fleet Manager, Driver |
| GET | `/api/expenses` | Fleet Manager, Financial Analyst |
| POST | `/api/expenses` | Fleet Manager |

### Dashboard & Reports
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/dashboard/kpis` | All roles |
| GET | `/api/reports/fuel-efficiency` | Fleet Manager, Financial Analyst |
| GET | `/api/reports/operational-cost` | Fleet Manager, Financial Analyst |
| GET | `/api/reports/roi` | Fleet Manager, Financial Analyst |

---

## 📊 Reports & Analytics

- **Fuel Efficiency** — Distance / Fuel per vehicle
- **Fleet Utilization %** — Active vehicles / Total vehicles
- **Operational Cost** — Fuel + Maintenance per vehicle
- **Vehicle ROI** — (Revenue - Costs) / Acquisition Cost
- **CSV Export** — All reports exportable

---

## 🚀 Deployment

- **Frontend** → Vercel
- **Backend** → Render
- **Database** → Supabase (Mumbai region)

---

## 👨‍💻 Team

Built for **Odoo Hackathon 2026** — Virtual Round

| Member | Role |
|--------|------|
| Suja AK | Full Stack |
| Teammate | Full Stack |