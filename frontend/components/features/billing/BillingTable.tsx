'use client';

import React, { useState, useEffect } from 'react';
import { billingApi, Bill } from '@/lib/api/billing';
import { DataTable } from '@/components/data-display/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Plus, Receipt, DollarSign, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface BillingTableProps {
  patientId?: string;
  onViewBill?: (bill: Bill) => void;
  onEditBill?: (bill: Bill) => void;
  onDeleteBill?: (billId: string) => void;
  onCreateBill?: () => void;
  onPayBill?: (bill: Bill) => void;
}

export const BillingTable: React.FC<BillingTableProps> = ({
  patientId,
  onViewBill,
  onEditBill,
  onDeleteBill,
  onCreateBill,
  onPayBill,
}) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bills based on filters
  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (patientId) {
        response = await billingApi.getBillsByPatientId(patientId);
      } else {
        response = await billingApi.getAllBills();
      }

      if (response.success && response.data) {
        setBills(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch bills');
      }
    } catch (err) {
      setError('An error occurred while fetching bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [patientId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'bill_date',
      label: 'Bill Date',
      render: (bill: Bill) => (
        <div className="font-medium">
          {format(new Date(bill.bill_date), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (bill: Bill) => (
        <div className="text-sm">
          {format(new Date(bill.due_date), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      key: 'patient_id',
      label: 'Patient ID',
      render: (bill: Bill) => (
        <div className="text-sm text-gray-600">{bill.patient_id}</div>
      ),
    },
    {
      key: 'items_count',
      label: 'Items',
      render: (bill: Bill) => (
        <div className="flex items-center gap-1">
          <Receipt className="h-4 w-4 text-blue-600" />
          <span>{bill.items?.length || 0}</span>
        </div>
      ),
    },
    {
      key: 'total_amount',
      label: 'Total Amount',
      render: (bill: Bill) => (
        <div className="flex items-center gap-1 font-medium">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span>${bill.total_amount.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'amount_paid',
      label: 'Paid',
      render: (bill: Bill) => (
        <div className="flex items-center gap-1">
          <CreditCard className="h-4 w-4 text-blue-600" />
          <span>${bill.amount_paid.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'balance_due',
      label: 'Balance Due',
      render: (bill: Bill) => (
        <div className={`font-medium ${bill.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ${bill.balance_due.toFixed(2)}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (bill: Bill) => (
        <Badge className={getStatusColor(bill.status)}>
          {bill.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (bill: Bill) => (
        <div className="flex space-x-2">
          {onViewBill && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewBill(bill)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onPayBill && bill.balance_due > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPayBill(bill)}
              title="Make Payment"
              className="text-green-600 hover:text-green-800"
            >
              <CreditCard className="h-4 w-4" />
            </Button>
          )}
          {onEditBill && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditBill(bill)}
              title="Edit Bill"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDeleteBill && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteBill(bill.id)}
              title="Delete Bill"
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
            <Button onClick={fetchBills} className="mt-4">
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
            <Receipt className="h-5 w-5" />
            Bills & Payments
            <Badge variant="secondary">{bills.length}</Badge>
          </CardTitle>
          {onCreateBill && (
            <Button onClick={onCreateBill} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Bill
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bills found</p>
            {onCreateBill && (
              <Button onClick={onCreateBill} className="mt-4">
                Create First Bill
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            data={bills}
            columns={columns}
            searchable
            searchPlaceholder="Search bills..."
          />
        )}
      </CardContent>
    </Card>
  );
};
