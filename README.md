<div align="center">

# 🚀 JobPilot

### Track applications. Manage interviews. Stay organized.

**A full-stack job and internship application tracker built to simplify the job search journey.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_JobPilot-16a34a?style=for-the-badge&logo=vercel&logoColor=white)](https://jobpilot-trackerv1.vercel.app/)
[![Backend API](https://img.shields.io/badge/API-Health_Check-2563eb?style=for-the-badge&logo=amazonaws&logoColor=white)](https://jobpilot-api-farshad.duckdns.org/api/v1/health)
[![GitHub](https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/farshadfazeen/JobPilot)

</div>

---

## ✨ About JobPilot

JobPilot brings job applications, company information, contacts, interviews, and progress tracking into **one simple workspace**. Instead of juggling spreadsheets and notes, job seekers can organize opportunities and follow each application from **Saved** to **Accepted**.

## 🎯 Features

- 🔐 **Authentication** — Register, log in, log out, and manage your account.
- 📋 **Applications** — Add, edit, filter, and update job applications.
- 🧩 **Pipeline** — Visual Kanban board for application statuses.
- 🏢 **Companies & Contacts** — Keep relevant people and organizations organized.
- 📅 **Interviews** — Track interview schedules and details.
- 📊 **Dashboard & Analytics** — See application activity and trends.
- 🔎 **Job Analysis** — Rule-based insights to support application review.
- ⚙️ **Settings** — Account preferences and management.

## 🛠️ Tech Stack

<div align="center">

**Frontend**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**Backend & Database**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

**Deployment & Tools**

![AWS](https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonaws&logoColor=232F3E)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=000000)
![NGINX](https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

</div>

## 🏗️ How It Works

```text
User / Browser
     │
     ▼
React + TypeScript (Vercel)
     │  HTTPS /api requests
     ▼
NGINX → Express API (AWS EC2)
     │
     ▼
Prisma ORM → PostgreSQL (Neon)
```

- **React** renders the interface and sends requests to the API.
- **Express** handles authentication, validation, and application logic.
- **Prisma** manages database queries and relationships.
- **PostgreSQL** stores users, applications, interviews, companies, and contacts.
- **Nginx + Let's Encrypt** provide reverse proxying and HTTPS for the AWS API.

## 📁 Project Structure

```text
JobPilot/
├── apps/
│   ├── web/       # React + TypeScript frontend
│   └── api/       # Express + Prisma backend
├── docs/          # Project documentation
└── package.json   # npm workspaces
```

## 💻 Run Locally

**Requirements:** Node.js, npm, and a PostgreSQL database.

```bash
git clone https://github.com/farshadfazeen/JobPilot.git
cd JobPilot
npm ci
```

Create `apps/api/.env` with your own development database URL and required environment variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Then generate Prisma Client and run the app in **two terminals**:

```bash
cd apps/api
npx prisma generate
# For a new development database with existing migrations:
npx prisma migrate deploy
```

```bash
# Terminal 1 — from repository root
npm run dev --workspace=@jobpilot/api
```

```bash
# Terminal 2 — from repository root
npm run dev --workspace=web
```

Open `http://localhost:5173`. **Never commit `.env` files or credentials.**

## ☁️ Live Deployment

| Layer | Platform |
|---|---|
| Frontend | Vercel |
| API | AWS EC2 (Node.js + systemd + Nginx) |
| Database | Neon PostgreSQL |
| Backend HTTPS | DuckDNS + Let's Encrypt |
| Source code | GitHub |

## 🧠 What I Learned

Building JobPilot gave me hands-on practice in **full-stack application architecture, REST APIs, database modelling, authentication, debugging, Git workflows, Linux server administration, and cloud deployment**.

---

<div align="center">

**Built by [Farshad](https://github.com/farshadfazeen)** · [🌐 Try JobPilot](https://jobpilot-trackerv1.vercel.app/)

</div>
