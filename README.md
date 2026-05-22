# 🏥 Hospital Management System
> **Online hospital appointment management system integrated with an AI-powered healthcare assistant.**
## 📖 Introduction
The **Hospital Management System** is a full-stack web application designed to digitize and streamline hospital and clinic operations. The platform enables patients to book appointments online, manage medical records, and make secure online payments. It also integrates an **AI-powered virtual assistant (Google Gemini)** to provide preliminary healthcare guidance and patient support.
## 🚀 Key Features
### 🤖 1. AI Support (Gemini Integration)
* AI chatbot available 24/7 to assist patients.
* Provides basic symptom guidance and healthcare consultation support.
* Helps users navigate appointment and medical procedures.
### 📅 2. Appointment Management
* Online appointment booking by specialty and doctor.
* Automatic schedule conflict detection.
* Appointment confirmation and notification support.
### 💳 3. Online Payment System
* Integrated with **VNPAY** payment gateway.
* Secure payment processing and transaction history tracking.
### 👥 4. User Role Management
#### Admin
* Manage doctors, patients, schedules, and system operations.
* Monitor reports and revenue statistics.
#### Doctor
* Manage work schedules and electronic medical records.
* View appointments and prescribe medications.
#### Patient
* Register accounts and book appointments online.
* View medical history and payment records.
## 🛠️ Tech Stack
### Core Technologies
* **Language:** TypeScript
* **Backend:** Node.js / Express
* **Frontend:** React.js / Next.js
* **Database:** PostgreSQL (PL/pgSQL)
* **DevOps:** Docker
### Third-party Services
* **Google Gemini API** — AI healthcare assistant
* **VNPAY** — Payment gateway integration
## 📂 Project Structure
hospital-management/
├── backend/            # API and server-side logic
├── database/           # Database schema and SQL scripts
├── frontend/           # Frontend source code
├── docker-compose.yml  # Docker configuration
└── README.md
## ⚙️ Installation & Setup
### Prerequisites

* Node.js (v18 or higher)
* PostgreSQL
* Docker (optional)
## 🚀 Getting Started
### 1. Clone the Repository
git clone https://github.com/hoainamdang10/hospital-management.git
cd hospital-management
### 2. Install Dependencies
### Backend
cd backend
npm install
### Frontend
cd ../frontend
npm install
### 3. Configure Environment Variables
Create a `.env` file based on `.env.example` and configure the following:
* Database credentials
* Gemini API key
* VNPAY configuration
* Other environment variables
### 4. Run the Application
#### Start Backend
cd backend
npm run start:dev
#### Start Frontend
cd frontend
npm run dev
## 📌 Future Improvements
* Real-time notifications
* Video consultation support
* AI-powered medical recommendations
* Cloud deployment with CI/CD pipeline
* Mobile application integration
