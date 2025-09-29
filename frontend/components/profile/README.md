# 🏥 Professional Profile Component

Trang profile chuyên nghiệp với avatar, thiết kế hiện đại và responsive cho Hospital Management System.

## ✨ Tính năng chính

### 📸 Avatar Upload
- Upload và preview avatar real-time
- Validation file type (chỉ hình ảnh)
- Validation file size (max 5MB)
- Fallback avatar với initials

### ✏️ Inline Editing
- Chỉnh sửa thông tin trực tiếp
- Form validation
- Auto-save functionality
- Cancel và restore data

### 📱 Responsive Design
- Mobile-first approach
- Tablet optimized
- Desktop enhanced
- Touch-friendly interface

### 🎭 Role-based UI
- Giao diện khác nhau cho bác sĩ và bệnh nhân
- Hiển thị thông tin phù hợp với từng role
- Dynamic form fields

## 🚀 Cách sử dụng

### 1. Import Component

```tsx
import { ProfessionalProfile } from "@/components/profile/ProfessionalProfile"
```

### 2. Sử dụng trong trang

```tsx
<ProfessionalProfile
  profileData={profileData}
  onSave={handleSave}
  onAvatarUpload={handleAvatarUpload}
  isLoading={loading}
/>
```

### 3. Props Interface

```tsx
interface ProfileData {
  id: string
  full_name: string
  email: string
  phone_number?: string
  role: 'doctor' | 'patient' | 'admin'
  avatar_url?: string
  
  // Doctor specific
  doctor_id?: string
  specialty?: string
  qualification?: string
  license_number?: string
  bio?: string
  experience_years?: number
  consultation_fee?: number
  languages_spoken?: string[]
  rating?: number
  total_reviews?: number
  
  // Patient specific
  patient_id?: string
  blood_type?: string
  date_of_birth?: string
  medical_history?: string
  allergies?: string[]
}
```

### 4. Event Handlers

```tsx
const handleSave = async (formData: Partial<ProfileData>) => {
  try {
    // Gọi API để lưu dữ liệu
    await updateProfile(formData)
    console.log('Profile saved successfully')
  } catch (error) {
    throw new Error('Failed to save profile')
  }
}

const handleAvatarUpload = async (file: File): Promise<string> => {
  try {
    // Upload file và trả về URL
    const response = await uploadAvatar(file)
    return response.avatar_url
  } catch (error) {
    throw new Error('Failed to upload avatar')
  }
}
```

## 🎨 Thiết kế

### Color Scheme
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Gray scale: Tailwind gray palette

### Typography
- Headings: Inter font, bold weights
- Body text: Inter font, regular weights
- Code: Mono font family

### Spacing
- Consistent 4px grid system
- Responsive spacing with Tailwind classes
- Proper visual hierarchy

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
  - Single column layout
  - Stacked avatar and info
  - Touch-optimized buttons

- **Tablet**: 768px - 1024px
  - Two column layout
  - Side-by-side avatar and info
  - Medium-sized components

- **Desktop**: > 1024px
  - Multi-column layout
  - Full feature set
  - Hover interactions

## 🔧 Customization

### Styling
Component sử dụng Tailwind CSS và có thể customize thông qua:
- CSS variables
- Tailwind config
- Component props

### Validation
- Built-in form validation
- Custom validation rules
- Error message display

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management

## 🧪 Testing

### Demo Page
Truy cập `/profile-demo` để xem demo component với:
- Mock data cho doctor và patient
- Interactive features
- Technical specifications

### Unit Tests
```bash
npm run test:profile
```

### E2E Tests
```bash
npm run test:e2e:profile
```

## 📦 Dependencies

### Core
- React 18+
- TypeScript
- Tailwind CSS

### UI Components
- Radix UI primitives
- Lucide React icons
- Custom UI components

### Utilities
- clsx for conditional classes
- date-fns for date formatting
- File validation utilities

## 🔄 Updates

### v1.0.0 (Current)
- ✅ Basic profile display
- ✅ Avatar upload
- ✅ Inline editing
- ✅ Role-based UI
- ✅ Responsive design

### v1.1.0 (Planned)
- 🔄 Advanced validation
- 🔄 Bulk edit mode
- 🔄 Export profile data
- 🔄 Profile templates

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - Hospital Management System
