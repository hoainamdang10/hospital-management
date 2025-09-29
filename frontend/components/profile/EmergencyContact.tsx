'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast-provider';
import { doctorsApi } from '@/lib/api/doctors';
import { 
  Phone, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  User,
  Mail,
  MapPin,
  AlertTriangle
} from 'lucide-react';

interface EmergencyContact {
  id?: string;
  contact_name: string;
  relationship: string;
  phone_number: string;
  email?: string;
  address?: {
    street?: string;
    district?: string;
    city?: string;
  };
  is_primary: boolean;
}

interface EmergencyContactProps {
  doctorId: string;
}

export default function EmergencyContact({ doctorId }: EmergencyContactProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<EmergencyContact>({
    contact_name: '',
    relationship: '',
    phone_number: '',
    email: '',
    address: {
      street: '',
      district: '',
      city: ''
    },
    is_primary: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
  }, [doctorId]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await doctorsApi.getEmergencyContacts(doctorId);
      
      if (response.success && response.data) {
        setContacts(response.data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh bạ khẩn cấp",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      contact_name: '',
      relationship: '',
      phone_number: '',
      email: '',
      address: {
        street: '',
        district: '',
        city: ''
      },
      is_primary: false
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (contact: EmergencyContact) => {
    setFormData({
      ...contact,
      email: contact.email || '',
      address: contact.address || { street: '', district: '', city: '' }
    });
    setEditingId(contact.id || null);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.contact_name || !formData.relationship || !formData.phone_number) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin bắt buộc",
          variant: "destructive"
        });
        return;
      }

      // Validate phone number
      if (!/^[0-9+\-\s()]+$/.test(formData.phone_number)) {
        toast({
          title: "Lỗi",
          description: "Số điện thoại không hợp lệ",
          variant: "destructive"
        });
        return;
      }

      const saveData = {
        ...formData,
        email: formData.email || undefined,
        address: formData.address?.street || formData.address?.district || formData.address?.city 
          ? formData.address 
          : undefined
      };

      let response;
      if (editingId) {
        response = await doctorsApi.updateEmergencyContact(doctorId, editingId, saveData);
      } else {
        response = await doctorsApi.addEmergencyContact(doctorId, saveData);
      }

      if (response.success) {
        toast({
          title: "Thành công",
          description: editingId ? "Đã cập nhật liên hệ" : "Đã thêm liên hệ mới",
        });
        fetchContacts();
        resetForm();
      } else {
        throw new Error(response.error?.message || 'Không thể lưu liên hệ');
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu liên hệ",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa liên hệ này?')) return;

    try {
      const response = await doctorsApi.deleteEmergencyContact(doctorId, id);
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa liên hệ",
        });
        fetchContacts();
      } else {
        throw new Error(response.error?.message || 'Không thể xóa liên hệ');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa liên hệ",
        variant: "destructive"
      });
    }
  };

  const formatAddress = (address?: { street?: string; district?: string; city?: string }) => {
    if (!address) return '';
    const parts = [address.street, address.district, address.city].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle>Liên hệ khẩn cấp</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Quản lý thông tin người liên hệ trong trường hợp khẩn cấp
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm liên hệ
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? 'Chỉnh sửa liên hệ' : 'Thêm liên hệ khẩn cấp'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Họ và tên *</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Mối quan hệ *</Label>
                <Input
                  id="relationship"
                  value={formData.relationship}
                  onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                  placeholder="VD: Vợ/Chồng, Con, Anh/Chị"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Số điện thoại *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="VD: 0987654321"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="VD: contact@email.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Địa chỉ</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Số nhà, đường"
                  value={formData.address?.street || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }))}
                />
                <Input
                  placeholder="Quận/Huyện"
                  value={formData.address?.district || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, district: e.target.value }
                  }))}
                />
                <Input
                  placeholder="Tỉnh/Thành phố"
                  value={formData.address?.city || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, city: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary: checked }))}
              />
              <Label htmlFor="is_primary">Đặt làm liên hệ chính</Label>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts List */}
      <div className="space-y-4">
        {contacts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có liên hệ khẩn cấp nào</p>
              <p className="text-sm text-gray-500 mt-1">
                Thêm ít nhất một liên hệ khẩn cấp để đảm bảo an toàn
              </p>
            </CardContent>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{contact.contact_name}</h3>
                      {contact.is_primary && (
                        <Badge variant="default" className="text-xs">
                          Liên hệ chính
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{contact.relationship}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{contact.phone_number}</span>
                      </div>

                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{contact.email}</span>
                        </div>
                      )}

                      {contact.address && formatAddress(contact.address) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{formatAddress(contact.address)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(contact.id!)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
