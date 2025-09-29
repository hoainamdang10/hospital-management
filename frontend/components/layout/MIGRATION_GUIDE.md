# Migration Guide: Universal Sidebar

Hướng dẫn chuyển đổi từ layout components cũ sang Universal Sidebar mới.

## 🎯 Tại sao nên migrate?

### Lợi ích của Universal Sidebar:
- **Tái sử dụng code**: Một component cho tất cả roles
- **Consistency**: Giao diện thống nhất across roles
- **Maintainability**: Dễ bảo trì và cập nhật
- **Responsive**: Mobile-first design
- **Customizable**: Dễ tùy chỉnh cho từng role
- **Performance**: Optimized rendering

### So sánh với layout cũ:
| Feature | Layout cũ | Universal Sidebar |
|---------|-----------|-------------------|
| Code reuse | ❌ Duplicate code | ✅ Single component |
| Mobile support | ⚠️ Basic | ✅ Full responsive |
| Customization | ❌ Hard-coded | ✅ Config-based |
| Consistency | ❌ Different styles | ✅ Unified design |
| Maintenance | ❌ Multiple files | ✅ Single source |

## 🔄 Migration Steps

### Step 1: Import mới

**Trước:**
```tsx
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DoctorLayout } from '@/components/layout/DoctorLayout';
import { PatientLayout } from '@/components/layout/PatientLayout';
```

**Sau:**
```tsx
import { AdminLayout, DoctorLayout, PatientLayout } from '@/components';
// hoặc
import { UniversalLayout } from '@/components';
```

### Step 2: Cập nhật props

**AdminLayout - Trước:**
```tsx
<AdminLayout title="Dashboard" activePage="dashboard">
  <div>Content</div>
</AdminLayout>
```

**AdminLayout - Sau:**
```tsx
<AdminLayout 
  title="Dashboard" 
  activePage="dashboard"
  subtitle="Welcome to admin dashboard" // New optional prop
  headerActions={<Button>Add New</Button>} // New optional prop
>
  <div>Content</div>
</AdminLayout>
```

### Step 3: Cập nhật activePage values

Đảm bảo `activePage` prop khớp với config trong `SidebarConfig.ts`:

**Admin pages:**
- `dashboard`, `appointments`, `doctors`, `patients`, `departments`, `rooms`
- `billing`, `payments`, `medical-records`, `prescriptions`, `microservices-dashboard`
- `settings`, `system-status`

**Doctor pages:**
- `dashboard`, `schedule`, `patients`, `appointments`, `medical-records`
- `prescriptions`, `lab-results`, `treatment-plans`, `messages`, `consultations`
- `settings`

**Patient pages:**
- `dashboard`, `appointments`, `medical-records`, `prescriptions`, `lab-results`
- `health-metrics`, `health-history`, `messages`, `telemedicine`
- `billing`, `insurance`, `settings`

## 📝 Migration Examples

### 1. Admin Dashboard

**Trước:**
```tsx
// app/admin/dashboard/page.tsx
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminDashboard() {
  return (
    <AdminLayout title="Dashboard" activePage="dashboard">
      <div className="space-y-6">
        <h2>Admin Dashboard Content</h2>
        {/* Dashboard content */}
      </div>
    </AdminLayout>
  );
}
```

**Sau:**
```tsx
// app/admin/dashboard/page.tsx
import { AdminLayout } from '@/components';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  return (
    <AdminLayout 
      title="Dashboard" 
      activePage="dashboard"
      subtitle="Hospital Management Overview"
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button>Quick Actions</Button>
        </div>
      }
    >
      <div className="space-y-6">
        <h2>Admin Dashboard Content</h2>
        {/* Dashboard content */}
      </div>
    </AdminLayout>
  );
}
```

### 2. Doctor Schedule

**Trước:**
```tsx
// app/doctor/schedule/page.tsx
import { DoctorLayout } from '@/components/layout/DoctorLayout';

export default function DoctorSchedule() {
  return (
    <DoctorLayout title="My Schedule" activePage="schedule">
      <div>Schedule content</div>
    </DoctorLayout>
  );
}
```

**Sau:**
```tsx
// app/doctor/schedule/page.tsx
import { DoctorLayout } from '@/components';

export default function DoctorSchedule() {
  return (
    <DoctorLayout 
      title="My Schedule" 
      activePage="schedule"
      subtitle="Manage your appointments and availability"
    >
      <div>Schedule content</div>
    </DoctorLayout>
  );
}
```

### 3. Patient Appointments

**Trước:**
```tsx
// app/patient/appointments/page.tsx
import { PatientLayout } from '@/components/layout/PatientLayout';

export default function PatientAppointments() {
  return (
    <PatientLayout title="Appointments" activePage="appointments">
      <div>Appointments content</div>
    </PatientLayout>
  );
}
```

**Sau:**
```tsx
// app/patient/appointments/page.tsx
import { PatientLayout } from '@/components';
import { Button } from '@/components/ui/button';

export default function PatientAppointments() {
  return (
    <PatientLayout 
      title="My Appointments" 
      activePage="appointments"
      subtitle="View and manage your medical appointments"
      headerActions={
        <Button>Book New Appointment</Button>
      }
    >
      <div>Appointments content</div>
    </PatientLayout>
  );
}
```

## 🎨 Advanced Customization

### Custom Sidebar cho role đặc biệt

```tsx
import { UniversalLayout, type SidebarConfig } from '@/components';
import { Shield, Users, Settings } from 'lucide-react';

const superAdminConfig: SidebarConfig = {
  branding: {
    logo: <Shield className="h-6 w-6 text-red-600" />,
    title: 'Super Admin',
    subtitle: 'System Control',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  sections: [
    {
      title: 'System Management',
      items: [
        {
          icon: Users,
          label: 'All Users',
          href: '/super-admin/users',
          page: 'users',
        },
        {
          icon: Settings,
          label: 'System Config',
          href: '/super-admin/config',
          page: 'config',
        },
      ],
    },
  ],
};

export default function SuperAdminPage() {
  return (
    <UniversalLayout
      title="Super Admin Panel"
      activePage="users"
      role="super-admin"
      sidebarProps={{
        customConfig: superAdminConfig,
      }}
    >
      <div>Super admin content</div>
    </UniversalLayout>
  );
}
```

## ⚠️ Breaking Changes

### 1. Props changes
- `children` prop vẫn giữ nguyên
- `title` prop vẫn giữ nguyên  
- `activePage` prop vẫn giữ nguyên
- **New:** `subtitle` prop (optional)
- **New:** `headerActions` prop (optional)

### 2. CSS Classes
- Layout wrapper classes có thể thay đổi
- Sidebar classes được chuẩn hóa
- Mobile responsive behavior được cải thiện

### 3. User Menu
- User menu được tích hợp sẵn trong sidebar
- Logout handler được truyền qua props
- Avatar và user info tự động hiển thị

## 🧪 Testing Migration

### 1. Visual Testing
```bash
# Chạy demo page để test
npm run dev
# Truy cập: http://localhost:3000/demo/sidebar
```

### 2. Functional Testing
- Test responsive behavior trên mobile/desktop
- Test navigation giữa các pages
- Test user menu và logout functionality
- Test active state highlighting

### 3. Performance Testing
- So sánh bundle size trước và sau migration
- Test rendering performance
- Test memory usage

## 🔧 Troubleshooting

### Sidebar không hiển thị
```tsx
// Kiểm tra import
import { AdminLayout } from '@/components'; // ✅ Correct
import { AdminLayout } from '@/components/layout/AdminLayout'; // ❌ Old way
```

### Active state không hoạt động
```tsx
// Kiểm tra activePage value
<AdminLayout activePage="dashboard" /> // ✅ Matches config
<AdminLayout activePage="home" />      // ❌ Not in config
```

### Mobile sidebar không responsive
```tsx
// Đảm bảo có Tailwind classes
className="lg:hidden" // Mobile only
className="hidden lg:block" // Desktop only
```

### User menu không hiển thị
```tsx
// Kiểm tra auth context
const { user } = useEnhancedAuth();
// User object phải có: full_name, email, role
```

## 📚 Resources

- [Universal Sidebar README](./README.md)
- [Component Demo](../../../app/demo/sidebar/page.tsx)
- [Sidebar Configuration](./SidebarConfig.ts)
- [Layout Examples](./SidebarDemo.tsx)
