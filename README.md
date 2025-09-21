# HostelHive 🏠  
*A Multi-Tenant Hostel Management SaaS built with Next.js (App Router)*

[![Next.js](https://img.shields.io/badge/Next.js-13%2B-black?logo=nextdotjs)](https://nextjs.org/)  
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)  
[![MySQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)    

---

## 🚀 About the Project

HostelHive is a **SaaS-based multi-tenant hostel management system** designed to handle different hostels under unique subdomains.  
It’s built on **Next.js (App Router)** with a modern stack and demonstrates experience in **scalable full-stack SaaS development**.


---

## ✨ Key Features

- **Next.js App Router**  
  - Uses the `app/` directory, layouts, and server components  
  - Server Actions + API routes for backend logic  

- **Authentication & Authorization**  
  - JWT-based auth with role-based access (Superadmin, Admin, Warden, Student)  
  - Middleware enforcement for protected routes  

- **Multi-Tenant SaaS Architecture**  
  - Subdomain-based tenant routing  
  - Isolated data per hostel  

- **Billing & Subscriptions**  
  - Stripe integration for paid plans and free trials (will be implemeted)
  - Webhooks for subscription lifecycle events (will be implemented)

- **Database Layer**  
  - MySQL with Sequelize ORM  
  - Migrations + relationships for scalability  

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router) + TailwindCSS  
- **Backend**: Node.js, Express-style API routes inside Next.js  
- **Database**: MySQL + Sequelize ORM  
- **Auth**: JWT & role-based middleware   
- **Deployment**: Render,Vercel

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
