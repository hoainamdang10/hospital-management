# Hospital Management System V2 - Frontend

Hệ thống quản lý bệnh viện hiện đại được xây dựng với Next.js 15, React 18, và TypeScript.

## 🚀 Tech Stack

- **Framework**: Next.js 15.3.2 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.8.3
- **Styling**: Tailwind CSS 4.1.7
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand + TanStack Query
- **Form Handling**: React Hook Form + Zod
- **API Client**: Axios
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Testing**: Jest + React Testing Library + Playwright

## 📁 Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   ├── providers.tsx        # Global providers
│   ├── globals.css          # Global styles
│   ├── (auth)/              # Auth pages group
│   ├── patient/             # Patient portal
│   ├── doctor/              # Doctor portal
│   ├── nurse/               # Nurse portal
│   └── admin/               # Admin portal
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Layout components
│   └── shared/              # Shared components
├── lib/                     # Utilities & helpers
│   ├── api/                 # API client & services
│   ├── utils.ts             # Utility functions
│   └── constants.ts         # Constants
├── types/                   # TypeScript types
│   ├── index.ts             # Common types
│   └── api/                 # Generated API types
├── hooks/                   # Custom React hooks
├── modules/                 # Feature modules
├── config/                  # Configuration files
├── public/                  # Static assets
└── docs/                    # Documentation
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp env.example .env.local

# Update .env.local with your API URLs
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3101
NEXT_PUBLIC_APP_NAME="Hospital Management System V2"
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Available Scripts

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
npm run test         # Run Jest tests
npm run e2e          # Run Playwright E2E tests
```

## 📝 Generate API Types

Generate TypeScript types from backend Swagger specs:

```bash
# Make sure all backend services are running first
cd backend/services-v2
npm run dev:all

# Then generate types
cd ../../frontend
npm run generate:types
```

This will create type definitions in `types/api/` for all services.

## 🎨 Design System

### Colors

- **Primary Blue**: `#0066CC` - Trust, professionalism
- **Primary Green**: `#00A86B` - Health, wellness
- **Destructive Red**: `#DC3545` - Errors, urgent actions
- **Warning Orange**: `#FF9500` - Warnings, CTAs

### Typography

- **Font Family**: Inter (Vietnamese-friendly)
- **Headings**: 700, 600, 500 weights
- **Body**: 400, 500 weights

### Spacing

Base unit: 8px (Tailwind spacing scale)

## 📄 Pages Overview

### Phase 1 (P0 - Critical) - 31 pages

**Public Pages**:
- Homepage `/`
- About Us `/about`
- Services `/services`

**Authentication**:
- Login `/login`
- Register `/register`
- Email Verification `/verify-email`

**Patient Portal**:
- Dashboard `/patient/dashboard`
- Book Appointment `/patient/appointments/book`
- My Appointments `/patient/appointments`

**Doctor Portal**:
- Dashboard `/doctor/dashboard`
- Schedule `/doctor/schedule`
- Queue Management `/doctor/queue`
- Patient Examination `/doctor/examination/:id`

**Admin Portal**:
- Dashboard `/admin/dashboard`
- User Management `/admin/users`
- Staff Management `/admin/staff`

See [docs/FRONTEND_ARCHITECTURE.md](./docs/FRONTEND_ARCHITECTURE.md) for complete pages list.

## 🔐 Authentication

Authentication flow uses JWT tokens:

- **Access Token**: Stored in localStorage
- **Refresh Token**: Stored in localStorage (consider httpOnly cookies for production)
- **Auto Refresh**: Handled by Axios interceptors
- **Protected Routes**: Middleware checks authentication

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run e2e

# E2E with UI
npm run e2e:ui
```

## 📚 Documentation

- [Frontend Architecture](./docs/FRONTEND_ARCHITECTURE.md) - Complete architecture guide
- [Pages Checklist](./docs/PAGES_CHECKLIST.md) - All 80 pages breakdown

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript strictly
3. Follow ESLint and Prettier rules
4. Write tests for new features
5. Update documentation

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🔗 Related Links

- [Backend Services](../backend/services-v2/README.md)
- [API Documentation](http://localhost:3101/api-docs)
- [Design System](./docs/FRONTEND_ARCHITECTURE.md#design-system)

## 📞 Support

For issues or questions, contact the development team.

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-11  
**Status**: ✅ Ready for Development
