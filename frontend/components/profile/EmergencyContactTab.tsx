'use client';

import { useState } from 'react';
import { Phone, Plus, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmergencyContact } from '@/lib/types/profile';
import { toast } from 'sonner';

interface EmergencyContactTabProps {
  contacts: EmergencyContact[];
  onUpdate: (contacts: EmergencyContact[]) => Promise<void>;
}

export function EmergencyContactTab({ contacts, onUpdate }: EmergencyContactTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [contactList, setContactList] = useState<EmergencyContact[]>(contacts);
  const [saving, setSaving] = useState(false);
  const [contactErrors, setContactErrors] = useState<{ name?: string; relationship?: string; phone?: string }[]>(contacts.map(() => ({ })));

  function addContact() {
    setContactList([
      ...contactList,
      {
        name: '',
        relationship: '',
        phone: '',
        email: '',
        address: '',
        isPrimary: contactList.length === 0,
      },
    ]);
    setContactErrors([...contactErrors, {}]);
  }

  function removeContact(index: number) {
    const newList = contactList.filter((_, i) => i !== index);
    setContactList(newList);
    const newErrors = contactErrors.filter((_, i) => i !== index);
    setContactErrors(newErrors);
  }

  function updateContact(index: number, field: keyof EmergencyContact, value: any) {
    const newList = [...contactList];
    newList[index] = { ...newList[index], [field]: value };
    setContactList(newList);
    const errs = [...contactErrors];
    if (field === 'name') errs[index] = { ...errs[index], name: value ? undefined : 'Họ và tên không được để trống' };
    if (field === 'relationship') errs[index] = { ...errs[index], relationship: value ? undefined : 'Mối quan hệ không được để trống' };
    if (field === 'phone') {
      const ok = /^0[0-9]{9}$/.test(value);
      errs[index] = { ...errs[index], phone: value && !ok ? 'Số điện thoại không đúng định dạng' : undefined };
    }
    setContactErrors(errs);
  }

  function setPrimary(index: number) {
    const newList = contactList.map((contact, i) => ({
      ...contact,
      isPrimary: i === index,
    }));
    setContactList(newList);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      for (const c of contactList) {
        if (!c.name || !c.relationship || !c.phone) {
          toast.error('Vui lòng điền đầy đủ tên, mối quan hệ và số điện thoại');
          return;
        }
        if (!/^0[0-9]{9}$/.test(c.phone)) {
          toast.error('Số điện thoại liên hệ khẩn cấp không đúng định dạng');
          return;
        }
      }
      await onUpdate(contactList);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating contacts:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Liên hệ khẩn cấp</h3>
          <p className="text-sm text-gray-500 mt-1">
            Thông tin người thân để liên hệ trong trường hợp khẩn cấp
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Chỉnh sửa
          </Button>
        )}
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {contactList.map((contact, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl border-2 p-6 ${
              contact.isPrimary ? 'border-primary' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-gray-900">
                  Người liên hệ {index + 1}
                </h4>
                {contact.isPrimary && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Chính
                  </span>
                )}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  {!contact.isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrimary(index)}
                    >
                      Đặt làm chính
                    </Button>
                  )}
                  {contactList.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContact(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                ) : (
                  <p className="text-gray-900 py-2">{contact.name}</p>
                )}
                {isEditing && contactErrors[index]?.name && (
                  <p className="text-red-500 text-xs mt-1">{contactErrors[index]?.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mối quan hệ
                </label>
                {isEditing ? (
                  <select
                    value={contact.relationship}
                    onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">Chọn mối quan hệ</option>
                    <option value="Vợ/Chồng">Vợ/Chồng</option>
                    <option value="Cha/Mẹ">Cha/Mẹ</option>
                    <option value="Con">Con</option>
                    <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                    <option value="Bạn bè">Bạn bè</option>
                    <option value="Khác">Khác</option>
                  </select>
                ) : (
                  <p className="text-gray-900 py-2">{contact.relationship}</p>
                )}
                {isEditing && contactErrors[index]?.relationship && (
                  <p className="text-red-500 text-xs mt-1">{contactErrors[index]?.relationship}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                ) : (
                  <p className="text-gray-900 py-2">{contact.phone}</p>
                )}
                {isEditing && contactErrors[index]?.phone && (
                  <p className="text-red-500 text-xs mt-1">{contactErrors[index]?.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (tùy chọn)
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={contact.email || ''}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{contact.email || '-'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ (tùy chọn)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={contact.address || ''}
                    onChange={(e) => updateContact(index, 'address', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{contact.address || '-'}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={addContact}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm người liên hệ
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setContactList(contacts);
              setIsEditing(false);
            }}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || contactErrors.some((e) => e.name || e.relationship || e.phone)}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      )}
    </div>
  );
}
