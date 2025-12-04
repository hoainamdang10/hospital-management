'use client';

import { useEffect, useState } from 'react';
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
  const [contactErrors, setContactErrors] = useState<
    { name?: string; relationship?: string; phone?: string }[]
  >(contacts.map(() => ({})));

  useEffect(() => {
    setContactList(contacts);
    setContactErrors(contacts.map(() => ({})));
  }, [contacts]);

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
    if (field === 'name')
      errs[index] = { ...errs[index], name: value ? undefined : 'Họ và tên không được để trống' };
    if (field === 'relationship')
      errs[index] = {
        ...errs[index],
        relationship: value ? undefined : 'Mối quan hệ không được để trống',
      };
    if (field === 'phone') {
      const ok = /^0[0-9]{9}$/.test(value);
      errs[index] = {
        ...errs[index],
        phone: value && !ok ? 'Số điện thoại không đúng định dạng' : undefined,
      };
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Liên hệ khẩn cấp</h3>
            <p className="text-sm text-gray-500">
              Thông tin người thân để liên hệ trong trường hợp khẩn cấp
            </p>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              Chỉnh sửa
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setContactList(contacts);
                  setIsEditing(false);
                }}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || contactErrors.some((e) => e.name || e.relationship || e.phone)}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {contactList.map((contact, index) => (
            <div
              key={index}
              className={`relative flex flex-col gap-4 rounded-xl border p-4 transition-all md:flex-row md:items-center md:gap-6 ${contact.isPrimary
                  ? 'border-blue-200 bg-blue-50/50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <Phone className="h-5 w-5" />
              </div>

              <div className="flex-1 space-y-4 md:space-y-0">
                {isEditing ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Họ và tên</label>
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => updateContact(index, 'name', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Nhập họ tên"
                      />
                      {contactErrors[index]?.name && (
                        <p className="text-xs text-red-500">{contactErrors[index]?.name}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Mối quan hệ</label>
                      <select
                        value={contact.relationship}
                        onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Chọn mối quan hệ</option>
                        <option value="Vợ/Chồng">Vợ/Chồng</option>
                        <option value="Cha/Mẹ">Cha/Mẹ</option>
                        <option value="Con">Con</option>
                        <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                        <option value="Bạn bè">Bạn bè</option>
                        <option value="Khác">Khác</option>
                      </select>
                      {contactErrors[index]?.relationship && (
                        <p className="text-xs text-red-500">
                          {contactErrors[index]?.relationship}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Số điện thoại</label>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="09..."
                      />
                      {contactErrors[index]?.phone && (
                        <p className="text-xs text-red-500">{contactErrors[index]?.phone}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{contact.name}</h4>
                        {contact.isPrimary && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Chính
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{contact.relationship}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium text-gray-900">{contact.phone}</p>
                      {contact.email && (
                        <p className="text-sm text-gray-500">{contact.email}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex items-center gap-2 md:flex-col">
                  {!contact.isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPrimary(index)}
                      title="Đặt làm liên hệ chính"
                      className="h-8 w-8 text-gray-400 hover:text-blue-600"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeContact(index)}
                    className="h-8 w-8 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={addContact}
              className="w-full border-dashed py-6 text-gray-500 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm người liên hệ
            </Button>
          )}

          {!isEditing && contactList.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              Chưa có thông tin liên hệ khẩn cấp
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
