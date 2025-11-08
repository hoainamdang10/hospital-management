# Frontend Setup Instructions

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend services running (for API integration)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

**Note**: Tất cả lỗi TypeScript hiện tại sẽ biến mất sau khi chạy `npm install`.

### 2. Configure Environment

```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local
nano .env.local
```

Minimum required variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:3101
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 What's Included

### ✅ Configuration Files
- `package.json` - All dependencies configured
- `tsconfig.json` - TypeScript with path aliases
- `tailwind.config.ts` - Design system colors
- `next.config.ts` - Next.js configuration
- `.eslintrc.json` - Linting rules
- `.prettierrc.json` - Code formatting
- `middleware.ts` - Route protection

### ✅ Core Structure
```
frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Homepage
│   ├── providers.tsx           # React Query + Toaster
│   ├── globals.css             # Global styles
│   └── (auth)/                 # Auth pages
│       ├── login/page.tsx      # ✅ Login page
│       ├── register/page.tsx   # ✅ Register page
│       └── layout.tsx          # Auth layout
├── components/
│   └── ui/
│       └── button.tsx          # ✅ Button component
├── lib/
│   ├── api/
│   │   ├── client.ts           # ✅ Axios + interceptors
│   │   ├── auth.ts             # ✅ Auth API service
│   │   └── index.ts            # API exports
│   ├── utils.ts                # ✅ Utility functions
│   └── constants.ts            # ✅ Constants & routes
├── types/
│   └── index.ts                # ✅ TypeScript types
├── hooks/
│   └── useAuth.ts              # ✅ Auth hook
└── middleware.ts               # ✅ Route protection
```

### ✅ Features Implemented

**Authentication**:
- ✅ Login page with form validation
- ✅ Register page with full form
- ✅ `useAuth` hook with React Query
- ✅ JWT token management
- ✅ Auto token refresh
- ✅ Route protection middleware

**API Integration**:
- ✅ Axios client with interceptors
- ✅ Error handling
- ✅ Auth API service (login, register, logout, verify, MFA)
- ✅ Token storage & retrieval

**UI Components**:
- ✅ Button component (shadcn/ui style)
- ✅ Form inputs with validation
- ✅ Toast notifications (sonner)
- ✅ Loading states

**Utilities**:
- ✅ `cn()` - Tailwind class merging
- ✅ `formatCurrency()` - VND formatting
- ✅ `formatDate()` - Vietnamese dates
- ✅ `formatPhoneNumber()` - Vietnamese phones
- ✅ Debounce, sleep, truncate, etc.

## 🔧 Next Steps

### Phase 1 - Remaining Pages (P0)

**Patient Portal** (3 pages):
```bash
# Create these pages:
app/patient/dashboard/page.tsx
app/patient/appointments/page.tsx
app/patient/appointments/book/page.tsx
```

**Doctor Portal** (4 pages):
```bash
# Create these pages:
app/doctor/dashboard/page.tsx
app/doctor/schedule/page.tsx
app/doctor/queue/page.tsx
app/doctor/examination/[id]/page.tsx
```

**Admin Portal** (3 pages):
```bash
# Create these pages:
app/admin/dashboard/page.tsx
app/admin/users/page.tsx
app/admin/staff/page.tsx
```

**Shared Components** (3 components):
```bash
# Create these components:
components/layout/Navbar.tsx
components/layout/Sidebar.tsx
components/shared/PatientSearch.tsx
```

### Generate API Types

Once backend services are running:

```bash
# Start all backend services first
cd ../backend/services-v2
npm run dev:all

# Then generate types
cd ../../frontend
npm run generate:types
```

This creates TypeScript types in `types/api/` for all services.

### Add More UI Components

Install shadcn/ui components as needed:

```bash
# Example: Add more components
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests (requires dev server running)
npm run e2e

# E2E with UI
npm run e2e:ui
```

## 📝 Development Guidelines

### File Naming
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts` or `PascalCase.ts`

### Code Style
- Use TypeScript strictly
- Follow ESLint rules
- Format with Prettier
- Use `'use client'` for client components
- Use Server Components by default

### API Calls
```typescript
// Use the useAuth hook
const { login, register, logout } = useAuth();

// Or use API client directly
import { authApi } from '@/lib/api';
const user = await authApi.getCurrentUser();
```

### Routing
```typescript
// Use Next.js Link
import Link from 'next/link';
<Link href="/patient/dashboard">Dashboard</Link>

// Or useRouter for programmatic navigation
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/patient/dashboard');
```

## 🐛 Troubleshooting

### TypeScript Errors
All "Cannot find module" errors will disappear after `npm install`.

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### API Connection Issues
1. Check backend services are running: `cd backend/services-v2 && npm run dev:all`
2. Verify API_URL in `.env.local`
3. Check browser console for CORS errors

### Build Errors
```bash
# Clean and rebuild
rm -rf .next
npm run build
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Backend API Docs](http://localhost:3101/api-docs)

## 🤝 Need Help?

- Check [FRONTEND_ARCHITECTURE.md](./docs/FRONTEND_ARCHITECTURE.md) for complete architecture
- Check [PAGES_CHECKLIST.md](./docs/PAGES_CHECKLIST.md) for all 80 pages breakdown
- Review [README.md](./README.md) for general information

---

**Status**: ✅ Ready for Development  
**Phase**: Phase 1 (MVP) - 18 pages  
**Progress**: 2/18 pages completed (Login, Register)
