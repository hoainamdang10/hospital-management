'use client';

import React, { useState, useEffect } from 'react';
import { prescriptionsApi, Prescription } from '@/lib/api/prescriptions';
import { DataTable } from '@/components/data-display/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Plus, Pill, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface PrescriptionsTableProps {
  patientId?: string;
  doctorId?: string;
  onViewPrescription?: (prescription: Prescription) => void;
  onEditPrescription?: (prescription: Prescription) => void;
  onDeletePrescription?: (prescriptionId: string) => void;
  onCreatePrescription?: () => void;
}

export const PrescriptionsTable: React.FC<PrescriptionsTableProps> = ({
  patientId,
  doctorId,
  onViewPrescription,
  onEditPrescription,
  onDeletePrescription,
  onCreatePrescription,
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch prescriptions based on filters
  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (patientId) {
        response = await prescriptionsApi.getPrescriptionsByPatientId(patientId);
      } else if (doctorId) {
        response = await prescriptionsApi.getPrescriptionsByDoctorId(doctorId);
      } else {
        response = await prescriptionsApi.getAllPrescriptions();
      }

      if (response.success && response.data) {
        setPrescriptions(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch prescriptions');
      }
    } catch (err) {
      setError('An error occurred while fetching prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId, doctorId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'dispensed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'prescription_date',
      label: 'Date',
      render: (prescription: Prescription) => (
        <div className="font-medium">
          {format(new Date(prescription.prescription_date), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      key: 'patient_id',
      label: 'Patient ID',
      render: (prescription: Prescription) => (
        <div className="text-sm text-gray-600">{prescription.patient_id}</div>
      ),
    },
    {
      key: 'doctor_id',
      label: 'Doctor ID',
      render: (prescription: Prescription) => (
        <div className="text-sm text-gray-600">{prescription.doctor_id}</div>
      ),
    },
    {
      key: 'items_count',
      label: 'Items',
      render: (prescription: Prescription) => (
        <div className="flex items-center gap-1">
          <Pill className="h-4 w-4 text-blue-600" />
          <span>{prescription.items?.length || 0}</span>
        </div>
      ),
    },
    {
      key: 'total_cost',
      label: 'Total Cost',
      render: (prescription: Prescription) => (
        <div className="flex items-center gap-1 font-medium">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span>${prescription.total_cost.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (prescription: Prescription) => (
        <Badge className={getStatusColor(prescription.status)}>
          {prescription.status}
        </Badge>
      ),
    },
    {
      key: 'dispensed_info',
      label: 'Dispensed',
      render: (prescription: Prescription) => (
        <div className="text-sm">
          {prescription.dispensed_at ? (
            <div>
              <div className="text-gray-600">
                {format(new Date(prescription.dispensed_at), 'MMM dd, yyyy')}
              </div>
              {prescription.dispensed_by && (
                <div className="text-xs text-gray-500">
                  by {prescription.dispensed_by}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400">Not dispensed</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (prescription: Prescription) => (
        <div className="flex space-x-2">
          {onViewPrescription && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewPrescription(prescription)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEditPrescription && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditPrescription(prescription)}
              title="Edit Prescription"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDeletePrescription && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeletePrescription(prescription.id)}
              title="Delete Prescription"
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
            <Button onClick={fetchPrescriptions} className="mt-4">
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
            <Pill className="h-5 w-5" />
            Prescriptions
            <Badge variant="secondary">{prescriptions.length}</Badge>
          </CardTitle>
          {onCreatePrescription && (
            <Button onClick={onCreatePrescription} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Prescription
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No prescriptions found</p>
            {onCreatePrescription && (
              <Button onClick={onCreatePrescription} className="mt-4">
                Create First Prescription
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            data={prescriptions}
            columns={columns}
            searchable
            searchPlaceholder="Search prescriptions..."
          />
        )}
      </CardContent>
    </Card>
  );
};
