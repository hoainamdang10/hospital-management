'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Search, Plus, Filter, Edit, Trash2, Eye, Loader2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { searchStaff, type Staff } from '@/lib/api/staff.service';

/**
 * Admin - Danh sách bác sĩ
 */
export default function DoctorsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  // Fetch doctors
  useEffect(() => {
    fetchDoctors();
  }, [pagination.page, searchQuery]);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Don't search if only 1 character (backend validation)
      if (searchQuery.length === 1) {
        return;
      }

      const response = await searchStaff({
        staffType: 'doctor',
        searchTerm: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      console.log('Full API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response.success:', response?.success);
      console.log('Response.data:', response?.data);
      
      if (response && response.success) {
        if (response.data && response.data.items) {
          console.log('Staff count:', response.data.items.length);
          setDoctors(response.data.items);
          setPagination(response.data.pagination);
          setError(null);
        } else if (response.data && Array.isArray(response.data.items)) {
          // Handle empty array
          console.log('Empty staff array');
          setDoctors([]);
          setPagination(response.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
          setError(null);
        } else {
          console.error('Invalid response structure:', response);
          console.error('Response.data type:', typeof response.data);
          console.error('Response.data value:', response.data);
          setError('Cấu trúc dữ liệu không hợp lệ');
        }
      } else {
        console.error('Response not successful or invalid:', response);
        setError('Phản hồi từ server không hợp lệ');
      }
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      // Don't show error for empty results, only for actual errors
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Không thể tải danh sách bác sĩ');
      } else {
        setError(null);
        setDoctors([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
  };

  // Debounced search effect
  useEffect(() => {
    // Don't search if only 1 character (backend requires min 2 chars)
    if (searchQuery.length === 1) {
      return;
    }

    const timer = setTimeout(() => {
      // Only trigger search if empty or >= 2 characters (backend validation requirement)
      if (searchQuery.length === 0 || searchQuery.length >= 2) {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bác sĩ</h1>
            <p className="text-gray-500 mt-1">Quản lý nhân viên y tế và thông tin của họ.</p>
          </div>
          <Link
            href="/admin/doctors/add"
            className="flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium"
          >
            <Plus className="h-5 w-5" />
            Thêm bác sĩ
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchDoctors}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Doctors List Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Danh sách bác sĩ</h2>
            <p className="text-sm text-gray-500 mt-1">Danh sách tất cả bác sĩ trong phòng khám của bạn với thông tin chi tiết.</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="p-6 border-b border-gray-200 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bác sĩ..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button 
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Lọc"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Xuất dữ liệu"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bác sĩ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chuyên khoa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kinh nghiệm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
                    <p className="text-gray-600 mt-2">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : !doctors || doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Search className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-900 font-medium">
                        {searchQuery ? 'Không tìm thấy kết quả' : 'Không có bác sĩ nào'}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {searchQuery 
                          ? `Không tìm thấy bác sĩ nào với từ khóa "${searchQuery}"`
                          : 'Chưa có bác sĩ nào trong hệ thống'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium">
                            {doctor.personalInfo.fullName.split(' ').pop()?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{doctor.personalInfo.fullName}</div>
                          <div className="text-sm text-gray-500">{doctor.professionalInfo.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doctor.specializations && doctor.specializations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {doctor.specializations.map((spec, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {spec.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Chưa có</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{doctor.personalInfo.email || 'N/A'}</div>
                        <div className="text-gray-400">{doctor.personalInfo.phoneNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doctor.yearsOfExperience || 0} năm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          doctor.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : doctor.status === 'suspended'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {doctor.status === 'active' ? 'Hoạt động' : doctor.status === 'suspended' ? 'Tạm nghỉ' : doctor.status === 'on_leave' ? 'Nghỉ phép' : 'Đã nghỉ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === doctor.id ? null : doctor.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          title="Thao tác"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                        
                        {openDropdown === doctor.id && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenDropdown(null)}
                            />
                            
                            {/* Dropdown menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <Link
                                href={`/admin/doctors/${doctor.id}`}
                                onClick={() => setOpenDropdown(null)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Xem chi tiết
                              </Link>
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  // Handle edit action
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Chỉnh sửa
                              </button>
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  // Handle delete action
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Xóa
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          {!isLoading && doctors && doctors.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Hiển thị <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> - <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong tổng số <span className="font-semibold">{pagination.total}</span>
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="p-2 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {/* Page Numbers */}
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                  let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
                  
                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }
                  
                  // First page
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setPagination({ ...pagination, page: 1 })}
                        className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-white transition-colors"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="dots1" className="px-2 text-gray-500">...</span>);
                    }
                  }
                  
                  // Middle pages
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setPagination({ ...pagination, page: i })}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          i === pagination.page
                            ? 'bg-blue-600 text-white border border-blue-600'
                            : 'border border-gray-300 hover:bg-white'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  // Last page
                  if (endPage < pagination.totalPages) {
                    if (endPage < pagination.totalPages - 1) {
                      pages.push(<span key="dots2" className="px-2 text-gray-500">...</span>);
                    }
                    pages.push(
                      <button
                        key={pagination.totalPages}
                        onClick={() => setPagination({ ...pagination, page: pagination.totalPages })}
                        className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-white transition-colors"
                      >
                        {pagination.totalPages}
                      </button>
                    );
                  }
                  
                  return pages;
                })()}
                
                {/* Next Button */}
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
