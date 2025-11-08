'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Phone, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { patientService, type EmergencyContact } from '@/lib/api/patient.service';
import { toast } from 'sonner';

/**
 * Patient Emergency Contacts Page
 * Route: /patient/emergency-contacts
 */
export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Mock patient ID - in real app, get from auth context
  const patientId = 'PAT-202411-001';

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await patientService.getEmergencyContacts(patientId);
      setContacts(result.contacts || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách liên hệ';
      setError(message);
      toast.error('Lỗi', { description: message });
      // Fallback to mock data for demo
      setContacts([
        {
          contactId: '1',
          name: 'Lê Thị D',
          relationship: 'Vợ',
          phoneNumber: '0987654321',
          email: 'lethid@example.com',
          address: '123 Đường ABC, Quận 1, TP.HCM',
          isPrimary: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (contact: Omit<EmergencyContact, 'contactId'>) => {
    try {
      const result = await patientService.addEmergencyContact(patientId, contact);
      toast.success('Thêm liên hệ thành công');
      setIsAdding(false);
      loadContacts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể thêm liên hệ';
      toast.error('Lỗi', { description: message });
    }
  };

  const handleUpdateContact = async (contactId: string, contact: Partial<EmergencyContact>) => {
    try {
      await patientService.updateEmergencyContact(patientId, contactId, contact);
      toast.success('Cập nhật liên hệ thành công');
      setEditingId(null);
      loadContacts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật liên hệ';
      toast.error('Lỗi', { description: message });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa liên hệ này?')) return;
    
    try {
      await patientService.deleteEmergencyContact(patientId, contactId);
      toast.success('Xóa liên hệ thành công');
      loadContacts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa liên hệ';
      toast.error('Lỗi', { description: message });
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      await patientService.setPrimaryContact(patientId, contactId);
      toast.success('Đã đặt làm liên hệ chính');
      loadContacts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể đặt liên hệ chính';
      toast.error('Lỗi', { description: message });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Liên hệ khẩn cấp</h1>
            <p className="mt-2 text-gray-600">
              Thông tin người liên hệ trong trường hợp khẩn cấp
            </p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Thêm liên hệ
          </Button>
        </div>

        {/* Add Contact Form */}
        {isAdding && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Thêm người liên hệ khẩn cấp
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Họ và tên
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nhập họ tên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mối quan hệ
                </label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option>Vợ/Chồng</option>
                  <option>Cha/Mẹ</option>
                  <option>Con</option>
                  <option>Anh/Chị/Em</option>
                  <option>Bạn bè</option>
                  <option>Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0912345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email (tùy chọn)
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="email@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <input
                type="checkbox"
                id="primary"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="primary" className="ml-2 text-sm text-gray-700">
                Đặt làm liên hệ chính
              </label>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Hủy
              </Button>
              <Button>Lưu</Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Emergency Contacts List */}
        <div className="space-y-4">
          {contacts.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center">
              <Phone className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Chưa có liên hệ khẩn cấp
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Thêm người liên hệ để được hỗ trợ trong trường hợp khẩn cấp
              </p>
              <Button className="mt-4" onClick={() => setIsAdding(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Thêm liên hệ đầu tiên
              </Button>
            </div>
          ) : (
            contacts.map((contact) => (
              <ContactCard
                key={contact.contactId}
                contact={contact}
                onDelete={() => handleDeleteContact(contact.contactId!)}
                onSetPrimary={() => handleSetPrimary(contact.contactId!)}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ContactCard({
  contact,
  onDelete,
  onSetPrimary,
}: {
  contact: EmergencyContact;
  onDelete: () => void;
  onSetPrimary: () => void;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
            {contact.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{contact.name}</h3>
              {contact.isPrimary && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                  Liên hệ chính
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">Mối quan hệ: {contact.relationship}</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="mr-2 h-4 w-4" />
                {contact.phoneNumber}
              </div>
              {contact.email && (
                <p className="text-sm text-gray-600">Email: {contact.email}</p>
              )}
              {contact.address && (
                <p className="text-sm text-gray-600">Địa chỉ: {contact.address}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {!contact.isPrimary && (
            <button
              onClick={onSetPrimary}
              className="text-primary hover:text-primary/80"
              title="Đặt làm liên hệ chính"
              aria-label="Đặt làm liên hệ chính"
            >
              <Edit className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800"
            title="Xóa liên hệ"
            aria-label="Xóa liên hệ"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
