# Smart Campus Bus Tracking System

A full-stack application built for campus transit management, featuring live tracking, dynamic seat booking, and distinct dashboards for Students, Drivers, and Administrators.

## 🚀 Quick Start Guide

Open this project folder in VS Code. The correct root folder contains the `backend` and `frontend` directories directly.

### 1. Run the Backend

Open a new terminal in VS Code and run:

```bash
cd backend
npm install
npm run dev
```
*(This will start the Node.js server on port 5000 and connect to MongoDB).*

### 2. Run the Frontend

Open a **second terminal** in VS Code and run:

```bash
cd frontend
npx http-server -p 8080
```

### 3. Open the App

Open your browser and navigate to:
**http://localhost:8080**

---

## 🔐 Demo Credentials

Use these credentials to test the system:

- **Student Login:** `student@lpu.in` / `password123`
- **Admin Login:** `admin@lpu.in` / `password123`
- **Driver Login:** `driver@lpu.in` / `password123`

---

## 📂 Project Structure

- `backend/` - Express server, MongoDB models, API routes, and Socket.IO logic.
- `frontend/` - HTML, CSS, and Vanilla JS UI logic.
