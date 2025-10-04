# HostelHive 🏠  
*A Multi-Tenant Hostel Management SaaS built with Next.js (App Router) for the frontend and the backend is Node.js and express.js*

[![Next.js](https://img.shields.io/badge/Next.js-13%2B-black?logo=nextdotjs)](https://nextjs.org/)  
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)  
[![MySQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)    

---

## 🚀 About the Project

HostelHive is a **SaaS-based multi-tenant hostel management system** designed to handle different hostels under unique subdomains.  
It’s built on **Next.js (App Router)** with backend in **Node.JS and ExpressJS** with a modern stack and demonstrates experience in **scalable full-stack SaaS development**.


---

## ✨ Key Features

- **Next.js App Router**  
  - Uses the `app/` directory, layouts, and server components  
  - Server Actions + API routes for backend logic  
- ** Node.JS and ExpressJS
  - Uses Node.JS for the backend and express routes for the apis
- **Authentication & Authorization**  
  - JWT-based auth with role-based access (Superadmin, Admin, Warden, Student)  
  - Middleware enforcement for protected routes  

- **Multi-Tenant SaaS Architecture**  
  - Subdomain-based tenant routing  
  - Isolated data per hostel  

- **Billing & Subscriptions**  
  - Stripe integration for paid plans and free trials.
  - Webhooks for subscription lifecycle events.

- **Database Layer**  
  - MySQL with Sequelize ORM  
  - Migrations + relationships for scalability  

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router) + TailwindCSS  
- **Backend**: Node.js, Express-style API routes
- **Database**: MySQL + Sequelize ORM  
- **Auth**: JWT & role-based middleware, Qouta Enforcements of payments
- **Deployment**: Vercel (Frotend) and AWS (Backend and Database)

---

## 📌 Why This Matters

- Multi-tenant architecture  
- Protected routes  
- Stripe billing  
- Modern TypeScript + Tailwind stack  


---

## ⚡ Quick Start (for this repo)

```bash
git clone https://github.com/azhank391/hostelhive
cd hostelhive
npm install
npm run dev
