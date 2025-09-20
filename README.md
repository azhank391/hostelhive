# HostelHive 🏠  
*A Multi-Tenant Hostel Management SaaS built with Next.js (App Router)*

[![Next.js](https://img.shields.io/badge/Next.js-13%2B-black?logo=nextdotjs)](https://nextjs.org/)  
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)  
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)  
[![Stripe](https://img.shields.io/badge/Billing-Stripe-purple?logo=stripe)](https://stripe.com/)  

---

## 🚀 About the Project

HostelHive is a **SaaS-based multi-tenant hostel management system** designed to handle different hostels under unique subdomains.  
It’s built on **Next.js (App Router)** with a modern stack and demonstrates experience in **scalable full-stack SaaS development**.

This repo is shared as part of my portfolio to showcase hands-on experience with **Next.js App Router** and enterprise-level features like RBAC, billing, and tenant isolation.

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
  - Stripe integration for paid plans and free trials  
  - Webhooks for subscription lifecycle events  

- **Database Layer**  
  - PostgreSQL with Sequelize ORM  
  - Migrations + relationships for scalability  

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router) + TailwindCSS  
- **Backend**: Node.js, Express-style API routes inside Next.js  
- **Database**: PostgreSQL + Sequelize ORM  
- **Auth**: JWT & role-based middleware  
- **Payments**: Stripe API + Webhooks  
- **Deployment**: Render  

---

## 📌 Why This Matters

If you’re looking for someone who can **confidently build with Next.js App Router**, I’ve already implemented it in a **real SaaS product** with:  
- Multi-tenant architecture  
- Protected routes  
- Stripe billing  
- Modern TypeScript + Tailwind stack  

This experience directly translates to building clean, scalable, and production-ready apps — exactly what your project needs.

---

## ⚡ Quick Start (for this repo)

```bash
git clone https://github.com/azhank391/hostelhive
cd hostelhive
npm install
npm run dev
