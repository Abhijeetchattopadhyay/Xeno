<div align="center">

<img src="https://img.shields.io/badge/XenoAI-CRM-6366f1?style=for-the-badge&logo=sparkles&logoColor=white" alt="XenoAI CRM" height="40"/>

# XenoAI CRM — Intelligent Shopper Engagement Platform

**An AI-native marketing CRM built for D2C & ecommerce brands.**  
Segment smarter. Campaign faster. Engage deeper.

[![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

[Live Demo](#) · [API Docs](#api-reference) · [Report Bug](issues) · [Request Feature](issues)

</div>

---

## 📸 Preview

> _Dark-themed, glassmorphism UI with real-time analytics, AI chat assistant, and campaign builder._

| Dashboard | Campaign Builder | AI Segmentation |
|-----------|-----------------|-----------------|
| ![Dashboard](https://placehold.co/380x220/0f0f1a/6366f1?text=Dashboard) | ![Campaign](https://placehold.co/380x220/0f0f1a/8b5cf6?text=Campaign+Builder) | ![Segments](https://placehold.co/380x220/0f0f1a/a78bfa?text=AI+Segments) |

---

## ✨ What is XenoAI?

XenoAI CRM is a **production-grade, AI-first marketing platform** that gives D2C and ecommerce brands the power to:

- 🧠 **Segment audiences using natural language** — just describe your target customer in plain English
- 🚀 **Generate full campaigns with AI** — subject lines, message bodies, CTAs, emojis, and tone
- 📡 **Simulate multi-channel delivery** — WhatsApp, Email, and SMS with async webhook callbacks
- 📊 **Track real-time analytics** — delivery rates, open rates, click-throughs, and failures
- 🤖 **Chat with an AI marketing assistant** — ask anything, get actionable insights instantly

Built to look and feel like a **real startup SaaS product** — not a side project.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        XenoAI CRM                               │
│                                                                  │
│  React Frontend (Vite)                                           │
│  └── Zustand Store → REST API + Socket.IO                       │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │    CRM Service        │    │   Channel Simulation Service │   │
│  │  (Node/Express)       │───▶│   (Node/Express)             │   │
│  │  - Auth (JWT)         │    │   - Email Simulator          │   │
│  │  - Customer CRUD      │    │   - WhatsApp Simulator       │   │
│  │  - Segment Engine     │    │   - SMS Simulator            │   │
│  │  - Campaign Manager   │◀───│   - Webhook Callbacks        │   │
│  │  - AI Integration     │    │   - Retry Logic              │   │
│  └──────────┬───────────┘    └──────────────────────────────┘   │
│             │                                                    │
│  ┌──────────▼───────────┐    ┌──────────────────────────────┐   │
│  │     MongoDB Atlas     │    │       Gemini / OpenAI        │   │
│  │  - Users, Customers   │    │  - Prompt → Filter Engine    │   │
│  │  - Segments           │    │  - Campaign Generator        │   │
│  │  - Campaigns          │    │  - Insight Engine            │   │
│  │  - Analytics Events   │    │  - Chat Assistant            │   │
│  └──────────────────────┘    └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow for a campaign send:**

```
Marketer clicks "Send" 
  → CRM Service queues campaign 
  → Calls Channel Service per recipient 
  → Channel Service simulates SENT / DELIVERED / FAILED / OPENED / CLICKED 
  → Async webhook fires back to CRM 
  → Analytics updated in real time 
  → Dashboard updates via Socket.IO
```

---

## ⚙️ Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| React 18 + Vite | UI framework & build tooling |
| Tailwind CSS | Utility-first styling |
| ShadCN UI | Accessible component primitives |
| Framer Motion | Animations & transitions |
| Recharts | Analytics charts |
| Zustand | Lightweight global state |
| Socket.IO Client | Real-time campaign updates |

### Backend
| Tool | Purpose |
|------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Primary database |
| JWT | Authentication |
| Socket.IO | Real-time event broadcasting |
| Bull / node-cron | Campaign scheduling & queues |
| Axios | Internal service communication |

### AI
| Tool | Purpose |
|------|---------|
| Google Gemini API | Primary AI engine |
| OpenAI API | Fallback / alternative |

### DevOps
| Tool | Purpose |
|------|---------|
| Vercel | Frontend deployment |
| Render / Railway | Backend deployment |
| MongoDB Atlas | Cloud database |

---

## 🗂️ Folder Structure

```
xenoai-crm/
│
├── client/                          # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/                  # ShadCN + custom primitives
│   │   │   ├── charts/              # Recharts wrappers
│   │   │   ├── layout/              # Sidebar, Topbar, Shell
│   │   │   └── shared/              # Buttons, Badges, Skeletons
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Segments.jsx
│   │   │   ├── CampaignBuilder.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── AIAssistant.jsx
│   │   ├── store/                   # Zustand slices
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # Axios API wrappers
│   │   ├── utils/
│   │   └── App.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── crm-service/                     # CRM Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── customer.controller.js
│   │   │   ├── segment.controller.js
│   │   │   ├── campaign.controller.js
│   │   │   └── analytics.controller.js
│   │   ├── services/
│   │   │   ├── ai.service.js        # Gemini integration
│   │   │   ├── campaign.service.js
│   │   │   ├── segment.service.js
│   │   │   └── webhook.service.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Customer.js
│   │   │   ├── Segment.js
│   │   │   ├── Campaign.js
│   │   │   └── AnalyticsEvent.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── validate.middleware.js
│   │   ├── jobs/                    # Schedulers & queues
│   │   └── server.js
│   └── package.json
│
├── channel-service/                 # Channel Simulation Backend
│   ├── src/
│   │   ├── simulators/
│   │   │   ├── email.simulator.js
│   │   │   ├── whatsapp.simulator.js
│   │   │   └── sms.simulator.js
│   │   ├── webhooks/
│   │   │   └── callback.js
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
│
├── .env.example
├── docker-compose.yml               # Local full-stack orchestration
└── README.md
```

---

## 🤖 AI Features

### 1. Natural Language Audience Segmentation
Type prompts in plain English — AI converts them to MongoDB filters instantly.

```
"Show inactive users who spent above ₹5000"
→ { lastActive: { $lt: 30days }, totalSpend: { $gte: 5000 } }

"Users who bought shoes but not jackets"
→ { purchasedCategories: { $in: ["shoes"], $nin: ["jackets"] } }

"High-value repeat buyers from Mumbai"
→ { orderCount: { $gte: 3 }, totalSpend: { $gte: 10000 }, city: "Mumbai" }
```

### 2. AI Campaign Generator
One-click generation of full multi-channel campaigns:

```json
{
  "subject": "Hey {{firstName}}, your favourites are back 🔥",
  "body": "We noticed you've been eyeing our top picks. Here's ₹300 off — just for you.",
  "cta": "Shop Now",
  "tone": "friendly",
  "channel": "whatsapp",
  "bestSendTime": "7:30 PM"
}
```

### 3. AI Marketing Insights
Auto-generated recommendations on the dashboard:

> _"📈 WhatsApp campaigns generate 2.4× more opens for repeat buyers vs. email"_  
> _"🕗 Campaigns sent at 6–8 PM see 28% higher click-through rates"_  
> _"⚠️ 340 users haven't opened anything in 30 days — consider a win-back flow"_

### 4. AI Assistant Chat
A GPT-style chat panel embedded in the dashboard — ask anything:

```
You: "Why did my last campaign underperform?"
AI:  "Your 'Summer Sale' campaign had a 14% open rate — below your 23% average.
      Primary factors: sent at 10 AM (low engagement window), subject line
      lacked personalization, and the segment included users inactive for 60+ days.
      Suggested fix: retarget with a personalized subject at 7 PM."
```

---

## 📡 Channel Simulation & Webhooks

The Channel Service simulates real-world delivery pipelines with probabilistic outcomes:

| Status | Probability | Trigger |
|--------|------------|---------|
| `SENT` | 100% | On dispatch |
| `DELIVERED` | ~85% | 2–5s after sent |
| `FAILED` | ~10% | Network / number errors |
| `OPENED` | ~45% of delivered | 30–120s delay |
| `CLICKED` | ~20% of opened | 60–180s delay |

Failed sends are **automatically retried** up to 3 times with exponential backoff.

---

## 📊 Analytics Dashboard

All campaign metrics update in **real-time** via Socket.IO callbacks:

- 📬 Delivery Rate
- 📖 Open Rate  
- 🖱️ Click-Through Rate (CTR)
- ❌ Failure Rate
- 📈 Campaign-over-Campaign comparison
- 👥 Audience engagement heatmaps

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- MongoDB (local or Atlas)
- Gemini API key ([get one free](https://aistudio.google.com/))

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/xenoai-crm.git
cd xenoai-crm
```

### 2. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
# CRM Service
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/xenoai
JWT_SECRET=your_super_secret_key
CHANNEL_SERVICE_URL=http://localhost:5001
GEMINI_API_KEY=your_gemini_api_key

# Channel Service
CHANNEL_PORT=5001
CRM_WEBHOOK_URL=http://localhost:5000/api/webhooks/delivery
```

### 3. Install & run all services

```bash
# Install root deps (if using workspaces)
npm install

# CRM Service
cd crm-service && npm install && npm run dev

# Channel Service (new terminal)
cd channel-service && npm install && npm run dev

# Frontend (new terminal)
cd client && npm install && npm run dev
```

App runs at → `http://localhost:5173`

### 4. Seed dummy data
```bash
cd crm-service && npm run seed
```
This loads **500 realistic ecommerce customers** with purchase history, tags, and order data.

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/auth/register` | Register a new brand account |
| POST | `/api/auth/login` | Login and receive JWT |

### Customers
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/customers` | List customers with filters & pagination |
| GET | `/api/customers/:id` | Customer profile + order history |
| POST | `/api/customers/import` | Bulk CSV import |

### Segments
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/segments` | List saved segments |
| POST | `/api/segments` | Create segment (manual or AI-prompt) |
| POST | `/api/segments/ai-parse` | Parse NL prompt → MongoDB filter |
| GET | `/api/segments/:id/preview` | Preview matched audience |

### Campaigns
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/campaigns` | List all campaigns |
| POST | `/api/campaigns` | Create campaign |
| POST | `/api/campaigns/generate` | AI-generate campaign content |
| POST | `/api/campaigns/:id/send` | Trigger campaign send |
| GET | `/api/campaigns/:id/stats` | Real-time campaign stats |

### Analytics
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/analytics/overview` | KPI summary |
| GET | `/api/analytics/campaigns` | Per-campaign breakdown |

### AI Assistant
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/ai/chat` | Chat with AI assistant |
| GET | `/api/ai/insights` | Get AI-generated insights |

### Webhooks (Channel → CRM)
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/webhooks/delivery` | Receive delivery status callbacks |

---

## 🗃️ Database Schemas

<details>
<summary><b>Customer</b></summary>

```js
{
  name: String,
  email: String,
  phone: String,
  city: String,
  tags: [String],           // "vip", "churned", "new"
  totalSpend: Number,
  orderCount: Number,
  lastActiveAt: Date,
  purchasedCategories: [String],
  createdAt: Date
}
```
</details>

<details>
<summary><b>Segment</b></summary>

```js
{
  name: String,
  description: String,
  type: "manual" | "ai",
  aiPrompt: String,         // original natural language prompt
  filters: Object,          // parsed MongoDB query
  audienceSize: Number,
  createdAt: Date
}
```
</details>

<details>
<summary><b>Campaign</b></summary>

```js
{
  name: String,
  channel: "email" | "whatsapp" | "sms",
  segmentId: ObjectId,
  content: {
    subject: String,
    body: String,
    cta: String,
    tone: String
  },
  status: "draft" | "scheduled" | "running" | "completed",
  scheduledAt: Date,
  stats: {
    sent: Number,
    delivered: Number,
    opened: Number,
    clicked: Number,
    failed: Number
  }
}
```
</details>

<details>
<summary><b>AnalyticsEvent</b></summary>

```js
{
  campaignId: ObjectId,
  customerId: ObjectId,
  channel: String,
  status: "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "FAILED",
  timestamp: Date,
  metadata: Object
}
```
</details>

---

## ☁️ Deployment

### Frontend → Vercel
```bash
cd client
vercel --prod
```
Set env var: `VITE_API_URL=https://your-crm-service.onrender.com`

### Backend → Render
1. Create two Web Services on [Render](https://render.com):
   - `xenoai-crm-service` → root: `crm-service/`, start: `npm start`
   - `xenoai-channel-service` → root: `channel-service/`, start: `npm start`
2. Add all environment variables from `.env.example`

### Database → MongoDB Atlas
1. Create a free M0 cluster
2. Whitelist Render IPs (or use `0.0.0.0/0` for dev)
3. Copy the connection string to `MONGO_URI`

---

## 📈 Scalability Decisions

| Decision | Rationale |
|----------|-----------|
| **Microservices (CRM + Channel)** | Independent scaling; channel service can be horizontally scaled for high-volume sends |
| **Async webhook callbacks** | CRM is never blocked waiting for delivery — fire-and-forget architecture |
| **Retry with backoff** | Handles transient failures without overloading the channel service |
| **MongoDB** | Flexible schema suits evolving customer attributes; horizontal sharding available |
| **Socket.IO** | Real-time dashboard without polling; upgradeable to Redis pub/sub at scale |
| **Zustand** | Minimal re-renders; scales well without Redux boilerplate |
| **Bull queues** | Campaign sends can be queued and rate-limited at millions-of-users scale |

**Path to 1M+ users:**
- Replace in-process Bull queues → AWS SQS / BullMQ + Redis
- Add rate limiting per channel (e.g., 100 WhatsApp msgs/sec)
- Introduce read replicas for analytics queries
- Move AI calls to background jobs to avoid request timeouts

---

## 🧑‍💻 Resume Description

> **XenoAI CRM** | Full-Stack AI SaaS | React · Node.js · MongoDB · Gemini AI
>
> Built a production-grade AI-native marketing CRM for D2C brands featuring natural language audience segmentation, AI-powered campaign generation, and multi-channel delivery simulation. Architected a dual-service system (CRM + Channel) with async webhook callbacks for real-time analytics. Integrated Gemini AI for prompt-to-filter conversion, campaign content generation, and an embedded chat assistant. Delivered a dark-theme dashboard with Framer Motion animations, Recharts visualizations, and Socket.IO real-time updates.

---

## 🗣️ Interview Talking Points

**"Walk me through the architecture."**
> "XenoAI is split into two services — a CRM service for all business logic and a Channel service for delivery simulation. When a marketer sends a campaign, the CRM fires messages to the Channel service asynchronously. The Channel service simulates delivery outcomes and fires webhook callbacks back to the CRM, which updates analytics in real time via Socket.IO. This decoupling lets each service scale independently."

**"How does the AI segmentation work?"**
> "The marketer types a plain-English prompt. We send it to Gemini with a system prompt that includes our data schema. Gemini returns a structured MongoDB filter as JSON, which we validate and execute. It maps things like 'inactive for 30 days' to `{ lastActiveAt: { $lt: new Date(Date.now() - 30*86400000) } }` automatically."

**"How would this scale to millions of users?"**
> "Right now campaign sends use an in-process queue. At scale, I'd move that to BullMQ with Redis and add horizontal replicas of the Channel service behind a load balancer. MongoDB can be sharded by brand ID. Analytics writes would go to a time-series store like InfluxDB or Timescale, and Socket.IO would move to Redis pub/sub."

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<div align="center">

Built with ❤️ by [Abhijeet](https://github.com/yourusername)

⭐ Star this repo if you found it useful!

</div>
