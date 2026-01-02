# 🏥 Hospital Management System

> **Hệ thống quản lý lịch khám bệnh trực tuyến tích hợp AI Chatbot hỗ trợ tư vấn.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

## 📖 Giới thiệu (Introduction)
Dự án **Hospital Management System** là một ứng dụng web toàn diện giúp số hóa quy trình vận hành phòng khám/bệnh viện. Hệ thống không chỉ giúp bệnh nhân đặt lịch dễ dàng mà còn tích hợp **Trợ lý ảo AI (Gemini)** để tư vấn sơ bộ, cùng cổng thanh toán **VNPAY** tiện lợi.

## 🚀 Tính năng nổi bật (Key Features)

### 🤖 1. AI Support (Gemini Integration)
* Chatbot thông minh hỗ trợ giải đáp thắc mắc của bệnh nhân 24/7.
* Tư vấn triệu chứng ban đầu và hướng dẫn quy trình khám.

### 📅 2. Quản lý Đặt lịch (Appointment Booking)
* Đặt lịch khám trực tuyến theo chuyên khoa và bác sĩ.
* Tự động kiểm tra trùng lịch, gửi thông báo xác nhận.

### 💳 3. Thanh toán Online (Payment)
* Tích hợp cổng thanh toán **VNPAY**.
* Quản lý hóa đơn và lịch sử giao dịch minh bạch.

### 👥 4. Phân hệ người dùng (User Roles)
* **Admin:** Quản lý toàn bộ hệ thống, nhân sự, báo cáo doanh thu.
* **Doctor:** Xem lịch làm việc, quản lý hồ sơ bệnh án điện tử, kê đơn thuốc.
* **Patient:** Đăng ký, đặt lịch, xem lịch sử khám, thanh toán.

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Core Language:** TypeScript (95%+)
* **Backend:** NodeJS / Express
* **Frontend:** ReactJS / NextJS
* **Database:** PostgreSQL (PLpgSQL)
* **DevOps:** Docker
* **Third-party Services:**
    * Google Gemini API (AI Chatbot)
    * VNPAY (Payment Gateway)

## 📂 Cấu trúc dự án (Project Structure)

```bash
hospital-management/
├── backend/            # Source code API & Server logic
├── database/           # Script SQL & Database schema
├── frontend/           # Source code giao diện người dùng
├── docker-compose.yml  # Cấu hình Docker (nếu có)
└── README.md           # Tài liệu dự án
⚙️ Cài đặt & Chạy dự án (Installation)
Yêu cầu (Prerequisites)
Node.js (v18 trở lên)
PostgreSQL
Docker (Tùy chọn)
Các bước thực hiện (Steps)
Clone dự án:
git clone [https://github.com/dangsuk1211/hospital-management.git](https://github.com/dangsuk1211/hospital-management.git)
cd hospital-management
Cài đặt Dependencies:
# Cài đặt cho Backend
cd backend
npm install
# Cài đặt cho Frontend
cd ../frontend
npm install
Cấu hình môi trường (.env):
Tạo file .env dựa trên .env.example.
Điền key API (Gemini, VNPAY, DB credentials...).
Khởi chạy:
# Chạy Backend
cd backend
npm run start:dev
# Chạy Frontend
cd frontend
npm run dev
