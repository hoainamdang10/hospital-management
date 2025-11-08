'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  code: string;
  phone: string;
}

interface PatientSearchProps {
  onSelect: (patient: Patient) => void;
  placeholder?: string;
}

/**
 * Patient Search Component
 * Reusable component for searching patients
 */
export function PatientSearch({ onSelect, placeholder = 'Tìm kiếm bệnh nhân...' }: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Patient[]>([]);

  // Mock data - replace with actual API call
  const mockPatients: Patient[] = [
    { id: '1', name: 'Nguyễn Văn A', code: 'BN-2025-001', phone: '0912345678' },
    { id: '2', name: 'Trần Thị B', code: 'BN-2025-002', phone: '0912345679' },
    { id: '3', name: 'Lê Văn C', code: 'BN-2025-003', phone: '0912345680' },
  ];

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length > 0) {
      // Mock search - replace with actual API call
      const filtered = mockPatients.filter(
        (p) =>
          p.name.toLowerCase().includes(value.toLowerCase()) ||
          p.code.toLowerCase().includes(value.toLowerCase()) ||
          p.phone.includes(value)
      );
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (patient: Patient) => {
    onSelect(patient);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto">
            {results.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelect(patient)}
                className="w-full border-b px-4 py-3 text-left transition-colors hover:bg-gray-50 last:border-0"
              >
                <p className="font-medium text-gray-900">{patient.name}</p>
                <p className="text-sm text-gray-600">
                  {patient.code} • {patient.phone}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && query && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white p-4 shadow-lg">
          <p className="text-center text-gray-500">Không tìm thấy bệnh nhân</p>
        </div>
      )}
    </div>
  );
}
