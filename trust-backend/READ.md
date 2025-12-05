# Sri Ekadanta Charitable Trust – Full Stack Management System

A complete **Trust Management System** built using **React (Frontend)**, **Node.js + Express (Backend)**, and **PostgreSQL (Neon Cloud)**.  
This system enables secure beneficiary verification, hospital concession processing, trust program management, and admin-only operations.

---

## 🚀 Tech Stack

### **Frontend**
- React.js 
- React Router v6
- Tailwind CSS (Responsive UI)
- React Hook Form
- Context API (Auth management)
- Axios (API calls)
- Lucide Icons

### **Backend**
- Node.js (Express.js)
- PostgreSQL (NeonDB serverless)
- pg (database driver)
- JWT Authentication (access + refresh tokens)
- Bcrypt.js (password security)
- dotenv (secure environment variables)
- Nodemon (dev auto-restart)

### **Database**
- PostgreSQL (Neon Cloud)
- Multiple linked tables with UUID primary keys
- Secure relational structure for trust management workflows

---

## 📦 Features Overview

### **Admin**
- Register using secure key
- Login with JWT authentication
- Manage hospitals
- Approve / Reject beneficiary registrations
- Create events
- Upload gallery images
- View system logs
- Manage hospital service records

### **Hospital Partners**
- Register using hospital key
- Login with secure role-based access
- Validate beneficiaries
- Provide concession details
- Submit service records

### **Public Users**
- No login required
- View:
  - Programs
  - Hospital Partners
  - Gallery
  - News & Events
  - Contact Information

---

## 📁 Project Structure

### **Frontend**
src/
├── components/
├── pages/
├── context/
├── services/
├── routes/
├── assets/
└── App.js


### **Backend**
src/
├── controllers/
├── routes/
├── middleware/
├── db/
├── utils/
└── server.js

---

## 🏛️ System Architecture Diagram (ASCII)

            ┌───────────────────────────┐
            │      FRONTEND (React)     │
            │  - React Router           │
            │  - Axios                  │
            │  - Context API Auth       │
            └─────────────┬─────────────┘
                          │ HTTPS/API
                          ▼
            ┌───────────────────────────┐
            │  BACKEND (Node + Express) │
            │ - Auth Routes             │
            │ - Admin Routes            │
            │ - Hospital Routes         │
            │ - JWT Auth Middleware     │
            └─────────────┬─────────────┘
                          │ PG Driver
                          ▼
            ┌───────────────────────────┐
            │   DATABASE (PostgreSQL)   │
            │ - Neon Cloud Serverless   │
            │ - 8 Relational Tables     │
            └───────────────────────────┘

---

## 🔄 Registration Flow (Flowchart)

      User Selects Role (Admin / Hospital)
                    │
                    ▼
         Enters Registration Key
                    │
          ┌─────────┴────────┐
             │ Key Valid? │
          └─────────┬────────┘
                    │Yes
                    ▼
           Fill Personal Details
                    │
                    ▼
            Backend Validation
                    │
                    ▼
             Account Created
                    │
                    ▼
          Redirect to Login Page

---

## 🔐 Authentication Flow

    User Login → Backend Checks Credentials
                    │
                    ▼
                If Valid:

          Access Token created
          Refresh Token created

     role_id checked (Only 1 or 2 allowed)
                    │
                    ▼
      Frontend Stores Tokens + User Data

---

## ✔️ Installation & Setup

### **Backend**

cd trust-backend
npm install
npm run dev

### **Frontend**

cd trust-frontend
npm install
npm start


