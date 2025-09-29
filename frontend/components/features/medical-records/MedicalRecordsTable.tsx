'use client';

import React, { useState, useEffect } from 'react';
import { medicalRecordsApi, MedicalRecord } from '@/lib/api/medical-records';
import { useApi } from '@/lib/hooks/useApi';
import { DataTable } from '@/components/data-display/DataTable';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Plus, FileText, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface MedicalRecordsTableProps {
  patientId?: string;
  doctorId?: string;
  onViewRecord?: (record: MedicalRecord) => void;
  onEditRecord?: (record: MedicalRecord) => void;
  onDeleteRecord?: (recordId: string) => void;
  onCreateRecord?: () => void;
}

export const MedicalRecordsTable: React.FC<MedicalRecordsTableProps> = ({
  patientId,
  doctorId,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
  onCreateRecord,
}) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch medical records based on filters
  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (patientId) {
        response = await medicalRecordsApi.getMedicalRecordsByPatientId(patientId);
      } else if (doctorId) {
        response = await medicalRecordsApi.getMedicalRecordsByDoctorId(doctorId);
      } else {
        response = await medicalRecordsApi.getAllMedicalRecords();
      }

      if (response.success && response.data) {
        setRecords(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch medical records');
      }
    } catch (err) {
      setError('An error occurred while fetching medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [patientId, doctorId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'visit_date',
      label: 'Visit Date',
      render: (record: MedicalRecord) => (
        <div className="font-medium">
          {format(new Date(record.visit_date), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      key: 'patient_id',
      label: 'Patient ID',
      render: (record: MedicalRecord) => (
        <div className="text-sm text-gray-600">{record.patient_id}</div>
      ),
    },
    {
      key: 'doctor_id',
      label: 'Doctor ID',
      render: (record: MedicalRecord) => (
        <div className="text-sm text-gray-600">{record.doctor_id}</div>
      ),
    },
    {
      key: 'chief_complaint',
      label: 'Chief Complaint',
      render: (record: MedicalRecord) => (
        <div className="max-w-xs truncate" title={record.chief_complaint}>
          {record.chief_complaint || 'N/A'}
        </div>
      ),
    },
    {
      key: 'diagnosis',
      label: 'Diagnosis',
      render: (record: MedicalRecord) => (
        <div className="max-w-xs truncate" title={record.diagnosis}>
          {record.diagnosis || 'N/A'}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (record: MedicalRecord) => (
        <Badge className={getStatusColor(record.status)}>
          {record.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (record: MedicalRecord) => (
        <div className="flex space-x-2">
          {onViewRecord && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewRecord(record)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEditRecord && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditRecord(record)}
              title="Edit Record"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDeleteRecord && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteRecord(record.id)}
              title="Delete Record"
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={fetchRecords} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Records
            <Badge variant="secondary">{records.length}</Badge>
          </CardTitle>
          {onCreateRecord && (
            <Button onClick={onCreateRecord} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Record
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No medical records found</p>
            {onCreateRecord && (
              <Button onClick={onCreateRecord} className="mt-4">
                Create First Record
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            data={records}
            columns={columns}
            searchable
            searchPlaceholder="Search medical records..."
          />
        )}
      </CardContent>
    </Card>
  );
};
