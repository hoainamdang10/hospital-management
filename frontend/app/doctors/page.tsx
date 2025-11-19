'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search, Calendar } from 'lucide-react';
import { searchStaff, type Staff } from '@/lib/api/staff.service';

/**
 * Doctors List Page
 * Route: /doctors
 */
export default function DoctorsPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await searchStaff({
          staffType: 'doctor',
          searchTerm: query || undefined,
          page: 1,
          limit: 9,
          status: 'active',
          isActive: true,
        });
        setItems(res?.data?.items || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">Đội ngũ bác sĩ</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm với nghề
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bác sĩ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 focus:ring-1 focus:outline-none"
            />
          </div>
          <select className="rounded-lg border border-gray-300 px-4 py-3">
            <option>Tất cả chuyên khoa</option>
            <option>Nội khoa</option>
            <option>Ngoại khoa</option>
            <option>Tim mạch</option>
            <option>Nhi khoa</option>
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-3 text-center text-gray-600">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="col-span-3 text-center text-gray-600">Không có bác sĩ phù hợp</div>
          ) : (
            items.map((d) => (
              <DoctorCard
                key={d.id}
                name={d.personalInfo?.fullName || 'Chưa cập nhật'}
                specialty={
                  d.specializations?.[0]?.name || d.professionalInfo?.department || 'Chưa cập nhật'
                }
                experience={`${d.yearsOfExperience || 0} năm kinh nghiệm`}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DoctorCard({
  name,
  specialty,
  experience,
}: {
  name: string;
  specialty: string;
  experience: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="bg-primary-100 text-primary-700 mb-4 flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold">
        {name.split(' ').pop()?.charAt(0)}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{name}</h3>
      <p className="text-primary-600 mb-1">{specialty}</p>
      <p className="mb-3 text-sm text-gray-600">{experience}</p>
      <Link
        href="/patient/appointments/book"
        className="bg-primary hover:bg-primary/90 block w-full rounded-lg py-2 text-center font-semibold text-white transition-colors"
      >
        <Calendar className="mr-2 inline h-4 w-4" />
        Đặt lịch khám
      </Link>
    </div>
  );
}
