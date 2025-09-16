# Software Portal

A full-stack application built with **Spring Boot (backend)** and **React (frontend)** for managing files and folders with role-based access.

---

## 🚀 Features
- 📂 Nested folder structure
- 📦 Upload files with progress bar
- 🔗 Upload via **direct URL** or **file chooser**
- 📊 File sizes shown in readable units
- 🗑️ Delete files/folders (Admin only)
- 🔑 Role-based authentication (Admin/User)
- 🐳 Dockerized with persistent storage volumes

---

## 🛠️ Tech Stack
- **Backend**: Spring Boot (Java 17+)
- **Frontend**: React + Vite
- **Database**: File system storage
- **Containerization**: Docker + Docker Compose

---

## 📂 Project Structure
```text
Software-Portal/
├── backend/            # Spring Boot backend
│   ├── src/
│   ├── storage/        # File storage (mounted volume)
│   └── Dockerfile
├── frontend/           # React frontend
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```


## ⚙️ Setup & Installation
**1. Clone the repository**
```
git clone https://github.com/vikrantmm/Software-Portal.git
cd Software-Portal
```

**2. Run with Docker Compose**
```
docker compose up --build
```
**3. Access the app**
Frontend → http://localhost:3000
Backend API → http://localhost:8080/api

## ⚡ Environment Variables
**Backend (application.properties)**
```
# Storage directory
storage.dir=/app/storage
```

**docker-compose.yml volume**
```
volumes:
  - ./backend/storage:/app/storage
```
This ensures uploaded files are stored persistently on your machine.


## 👥 Authentication
Default roles and credentials:
**Admin**
Username: admin
Password: password

**User**
Username: user
Password: password


## 📦 Example API Endpoints
```
POST   /api/login                 # Login
GET    /api/folders?path=...      # List files/folders
POST   /api/folders               # Create folder
POST   /api/upload                # Upload file or via link
DELETE /api/folders?path=...      # Delete file/folder
GET    /api/download?path=...     # Download file
```

## 🖥️ Development (without Docker)
**Backend**
```
cd backend
./mvnw spring-boot:run
```

**Frontend**
```
cd frontend
npm install
npm run dev
```


