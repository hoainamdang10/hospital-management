# Universal Sidebar Component

Một component sidebar có thể tái sử dụng cho admin, doctor và patient trong hệ thống Hospital Management.

## 🚀 Tính năng

- **Role-based navigation**: Tự động hiển thị menu phù hợp với từng role
- **Responsive design**: Hoạt động tốt trên mobile và desktop
- **Customizable branding**: Logo, màu sắc, title có thể tùy chỉnh
- **User menu integration**: Tích hợp avatar, thông tin user và logout
- **Badge support**: Hiển thị thông báo, số lượng trên menu items
- **Active state management**: Tự động highlight trang hiện tại
- **Mobile-friendly**: Sidebar collapse trên mobile với overlay

## 📦 Components

### 1. UniversalSidebar
Component sidebar chính có thể tái sử dụng.

### 2. UniversalLayout  
Layout wrapper bao gồm sidebar + header + content area.

### 3. Role-specific Layouts
- `AdminLayout` - Layout cho admin
- `DoctorLayout` - Layout cho doctor  
- `PatientLayout` - Layout cho patient

## 🎯 Cách sử dụng

### Sử dụng Layout Components (Khuyến nghị)

```tsx
import { AdminLayout, DoctorLayout, PatientLayout } from '@/components';

// Admin Dashboard
export default function AdminDashboard() {
  return (
    <AdminLayout
      title="Dashboard"
      activePage="dashboard"
      subtitle="Welcome to admin dashboard"
      headerActions={
        <Button>Add New</Button>
      }
    >
      <div>Your dashboard content here</div>
    </AdminLayout>
  );
}

// Doctor Schedule
export default function DoctorSchedule() {
  return (
    <DoctorLayout
      title="My Schedule"
      activePage="schedule"
    >
      <div>Doctor schedule content</div>
    </DoctorLayout>
  );
}

// Patient Appointments
export default function PatientAppointments() {
  return (
    <PatientLayout
      title="My Appointments"
      activePage="appointments"
    >
      <div>Patient appointments content</div>
    </PatientLayout>
  );
}
```

### Sử dụng UniversalSidebar trực tiếp

```tsx
import { UniversalSidebar } from '@/components';
import { useEnhancedAuth } from '@/lib/auth/auth-wrapper';

export default function CustomLayout() {
  const { user, signOut } = useEnhancedAuth();
  
  return (
    <div className="flex min-h-screen">
      <UniversalSidebar
        role="admin"
        activePage="dashboard"
        user={user}
        onLogout={signOut}
      />
      <main className="flex-1">
        Your content here
      </main>
    </div>
  );
}
```

### Custom Sidebar Configuration

```tsx
import { UniversalSidebar, type SidebarConfig } from '@/components';
import { Home, Settings } from 'lucide-react';

const customConfig: SidebarConfig = {
  branding: {
    logo: <Home className="h-6 w-6" />,
    title: 'Custom Portal',
    subtitle: 'My Application',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  sections: [
    {
      items: [
        {
          icon: Home,
          label: 'Dashboard',
          href: '/dashboard',
          page: 'dashboard',
        },
        {
          icon: Settings,
          label: 'Settings',
          href: '/settings',
          page: 'settings',
          badge: 'New',
          badgeVariant: 'destructive',
        },
      ],
    },
  ],
};

export default function CustomSidebar() {
  return (
    <UniversalSidebar
      role="custom"
      activePage="dashboard"
      customConfig={customConfig}
    />
  );
}
```

## 🎨 Customization

### Sidebar Branding
Mỗi role có thể có branding riêng:

```tsx
const customBranding = {
  logo: <YourLogo />,
  title: 'Your Portal',
  subtitle: 'Your Subtitle',
  bgColor: 'bg-your-color-50',
  iconColor: 'text-your-color-600',
};
```

### Menu Items với Badge
```tsx
{
  icon: MessageCircle,
  label: 'Messages',
  href: '/messages',
  page: 'messages',
  badge: '5',
  badgeVariant: 'destructive', // 'default' | 'secondary' | 'destructive' | 'outline'
}
```

### Menu Sections
```tsx
{
  title: 'Section Title', // Optional
  items: [
    // Menu items here
  ]
}
```

## 🔧 Props

### UniversalSidebarProps
```tsx
interface UniversalSidebarProps {
  role: string;                    // 'admin' | 'doctor' | 'patient' | custom
  activePage: string;              // Current active page identifier
  user?: {                         // User information
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  };
  onLogout?: () => void;           // Logout handler
  className?: string;              // Additional CSS classes
  customConfig?: SidebarConfig;    // Custom sidebar configuration
}
```

### UniversalLayoutProps
```tsx
interface UniversalLayoutProps {
  children: React.ReactNode;       // Page content
  title: string;                   // Page title
  activePage: string;              // Current active page
  role: string;                    // User role
  subtitle?: string;               // Optional subtitle
  headerActions?: React.ReactNode; // Header action buttons
  className?: string;              // Additional CSS classes
  sidebarProps?: Partial<UniversalSidebarProps>; // Sidebar customization
}
```

## 🎯 Migration từ Layout cũ

Để migrate từ layout cũ sang Universal Layout:

### Trước (AdminLayout cũ)
```tsx
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function Page() {
  return (
    <AdminLayout title="Dashboard" activePage="dashboard">
      <div>Content</div>
    </AdminLayout>
  );
}
```

### Sau (Universal Layout)
```tsx
import { AdminLayout } from '@/components';

export default function Page() {
  return (
    <AdminLayout title="Dashboard" activePage="dashboard">
      <div>Content</div>
    </AdminLayout>
  );
}
```

## 🔍 Troubleshooting

### Sidebar không hiển thị đúng role
Kiểm tra prop `role` có đúng giá trị: 'admin', 'doctor', 'patient'

### Menu item không active
Đảm bảo `activePage` prop khớp với `page` trong menu configuration

### Mobile sidebar không hoạt động
Kiểm tra z-index và responsive classes

### User menu không hiển thị
Đảm bảo prop `user` được truyền và có đủ thông tin

## 📱 Responsive Behavior

- **Desktop (lg+)**: Sidebar luôn hiển thị
- **Mobile (<lg)**: Sidebar ẩn, hiển thị button toggle
- **Overlay**: Trên mobile có overlay khi sidebar mở
- **Auto-close**: Sidebar tự đóng khi click menu item trên mobile
