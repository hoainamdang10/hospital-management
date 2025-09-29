# Supabase DataTable Components

Các component DataTable được thiết kế đặc biệt cho dữ liệu từ Supabase database của ứng dụng quản lý bệnh viện.

## 🗄️ Cấu trúc Database

Các component này được thiết kế dựa trên cấu trúc database thực tế:

### Tables
- **doctors**: Thông tin bác sĩ
- **patients**: Thông tin bệnh nhân  
- **appointments**: Cuộc hẹn khám
- **rooms**: Phòng bệnh viện
- **departments**: Khoa/phòng ban
- **users**: Người dùng hệ thống
- **login_sessions**: Lịch sử đăng nhập

## 📊 Components

### 1. SupabaseDoctorsTable

Hiển thị danh sách bác sĩ với đầy đủ thông tin.

```tsx
import { SupabaseDoctorsTable } from '@/components';

<SupabaseDoctorsTable
  doctors={doctors}
  departments={departments}
  isLoading={isLoading}
  currentPage={currentPage}
  totalPages={totalPages}
  itemsPerPage={10}
  totalItems={totalItems}
  onPageChange={handlePageChange}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onRowClick={handleRowClick}
/>
```

**Tính năng:**
- Hiển thị ảnh đại diện bác sĩ
- Thông tin chuyên khoa và trình độ
- Liên kết với khoa
- Thông tin liên hệ
- Lịch làm việc

### 2. SupabasePatientsTable

Hiển thị danh sách bệnh nhân với thông tin y tế.

```tsx
import { SupabasePatientsTable } from '@/components';

<SupabasePatientsTable
  patients={patients}
  isLoading={isLoading}
  currentPage={currentPage}
  totalPages={totalPages}
  itemsPerPage={10}
  totalItems={totalItems}
  onPageChange={handlePageChange}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Tính năng:**
- Tính tuổi tự động từ ngày sinh
- Hiển thị nhóm máu
- Thông tin bảo hiểm
- Dị ứng và bệnh mãn tính
- Ngày đăng ký

### 3. SupabaseAppointmentsTable

Hiển thị danh sách cuộc hẹn với thông tin bệnh nhân và bác sĩ.

```tsx
import { SupabaseAppointmentsTable } from '@/components';

<SupabaseAppointmentsTable
  appointments={appointments}
  isLoading={isLoading}
  currentPage={currentPage}
  totalPages={totalPages}
  itemsPerPage={10}
  totalItems={totalItems}
  onPageChange={handlePageChange}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Tính năng:**
- Thông tin ngày giờ hẹn
- Liên kết bệnh nhân và bác sĩ
- Mô tả điều trị
- Trạng thái cuộc hẹn
- Badge màu theo trạng thái

### 4. SupabaseRoomsTable

Hiển thị danh sách phòng với thông tin khoa và trạng thái.

```tsx
import { SupabaseRoomsTable } from '@/components';

<SupabaseRoomsTable
  rooms={rooms}
  departments={departments}
  isLoading={isLoading}
  currentPage={currentPage}
  totalPages={totalPages}
  itemsPerPage={10}
  totalItems={totalItems}
  onPageChange={handlePageChange}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Tính năng:**
- Icon theo loại phòng
- Sức chứa phòng
- Trạng thái sử dụng
- Liên kết với khoa

### 5. SupabaseSearchableTable

Component tổng hợp với tìm kiếm và lọc cho tất cả loại dữ liệu.

```tsx
import { SupabaseSearchableTable } from '@/components';

<SupabaseSearchableTable
  type="doctors" // 'doctors' | 'patients' | 'appointments' | 'rooms'
  data={data}
  departments={departments}
  title="Quản lý Bác sĩ"
  description="Danh sách tất cả bác sĩ"
  isLoading={isLoading}
  onAdd={() => setShowAddDialog(true)}
  addButtonLabel="Thêm Bác sĩ"
  onEdit={handleEdit}
  onDelete={handleDelete}
  onRowClick={handleRowClick}
  searchPlaceholder="Tìm kiếm bác sĩ..."
  itemsPerPage={10}
/>
```

**Tính năng:**
- Tìm kiếm thông minh theo nhiều trường
- Lọc theo trạng thái
- Lọc theo khoa (nếu có)
- Header với nút thêm mới
- Tự động phân trang

## 🎨 Styling và Responsive

### Responsive Design
- **sm**: Ẩn cột trên màn hình nhỏ
- **md**: Ẩn cột trên màn hình trung bình
- **lg**: Ẩn cột trên màn hình lớn
- **xl**: Chỉ hiện trên màn hình rất lớn

### Status Colors
- **Đã xác nhận**: Xanh lá (default)
- **Chờ xác nhận**: Xám (secondary)
- **Đã hủy**: Đỏ (destructive)
- **Hoàn thành**: Viền (outline)

### Gender Colors
- **Nam**: Xanh dương (default)
- **Nữ**: Hồng (secondary)
- **Khác**: Viền (outline)

## 🔧 Integration với Supabase

### Fetching Data

```tsx
import { supabase } from '@/lib/supabase';

// Fetch doctors with department info
const fetchDoctors = async () => {
  const { data, error } = await supabase
    .from('doctors')
    .select(`
      *,
      departments (
        department_name
      )
    `);
  
  return data;
};

// Fetch appointments with patient and doctor info
const fetchAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients (
        full_name,
        phone_number
      ),
      doctors (
        full_name,
        specialty
      )
    `);
  
  return data;
};
```

### Real-time Updates

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const [doctors, setDoctors] = useState([]);

useEffect(() => {
  // Subscribe to changes
  const subscription = supabase
    .channel('doctors_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'doctors' },
      (payload) => {
        // Update local state
        fetchDoctors();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## 📝 Type Safety

Tất cả components sử dụng TypeScript types được định nghĩa trong `@/lib/types/supabase.ts`:

```tsx
import { 
  SupabaseDoctor,
  SupabasePatient,
  SupabaseAppointment,
  SupabaseRoom,
  SupabaseDepartment 
} from '@/lib/types/supabase';
```

## 🚀 Best Practices

1. **Luôn sử dụng loading states** khi fetch dữ liệu
2. **Implement error handling** cho các API calls
3. **Sử dụng pagination** cho datasets lớn
4. **Cache dữ liệu** khi có thể
5. **Validate dữ liệu** trước khi hiển thị
6. **Sử dụng real-time subscriptions** cho dữ liệu quan trọng

## 📱 Mobile Optimization

- Các cột không quan trọng sẽ ẩn trên mobile
- Touch-friendly buttons và spacing
- Horizontal scroll cho tables rộng
- Responsive pagination controls

## 🔍 Search Features

### Doctors
- Tên, ID, chuyên khoa, email, số điện thoại

### Patients  
- Tên, ID, email, số điện thoại, nhóm máu

### Appointments
- ID cuộc hẹn, tên bệnh nhân, tên bác sĩ, mô tả

### Rooms
- ID phòng, số phòng, loại phòng, trạng thái
