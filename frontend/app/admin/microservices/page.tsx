'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MedicalRecordsTable } from '@/components/features/medical-records/MedicalRecordsTable';
import { PrescriptionsTable } from '@/components/features/prescriptions/PrescriptionsTable';
import { BillingTable } from '@/components/features/billing/BillingTable';
// import { MicroservicesHealthCheck } from '@/components/test/MicroservicesHealthCheck';
import {
  FileText,
  Pill,
  Receipt,
  Activity,
  Server,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

import { AdminPageWrapper } from '../page-wrapper';

function MicroservicesPageContent() {
  const [activeTab, setActiveTab] = useState('medical-records');
  const [serviceStatus, setServiceStatus] = useState({
    'medical-records': 'unknown',
    'prescriptions': 'unknown',
    'billing': 'unknown',
  });

  const checkServiceHealth = async (service: string) => {
    try {
      // This would be replaced with actual health check calls
      const response = await fetch(`/api/${service}/health`);
      if (response.ok) {
        setServiceStatus(prev => ({ ...prev, [service]: 'healthy' }));
      } else {
        setServiceStatus(prev => ({ ...prev, [service]: 'unhealthy' }));
      }
    } catch (error) {
      setServiceStatus(prev => ({ ...prev, [service]: 'unhealthy' }));
    }
  };

  const checkAllServices = async () => {
    await Promise.all([
      checkServiceHealth('medical-records'),
      checkServiceHealth('prescriptions'),
      checkServiceHealth('billing'),
    ]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Microservices Integration</h1>
          <p className="text-gray-600 mt-2">
            Test and manage hospital management microservices
          </p>
        </div>
        <Button onClick={checkAllServices} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Check Services
        </Button>
      </div>

      {/* Health Check */}
      {/* <MicroservicesHealthCheck /> */}

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Medical Records</h3>
                  <p className="text-sm text-gray-600">Port 3006</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(serviceStatus['medical-records'])}
                <Badge className={getStatusColor(serviceStatus['medical-records'])}>
                  {serviceStatus['medical-records']}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Pill className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Prescriptions</h3>
                  <p className="text-sm text-gray-600">Port 3007</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(serviceStatus['prescriptions'])}
                <Badge className={getStatusColor(serviceStatus['prescriptions'])}>
                  {serviceStatus['prescriptions']}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Billing</h3>
                  <p className="text-sm text-gray-600">Port 3008</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(serviceStatus['billing'])}
                <Badge className={getStatusColor(serviceStatus['billing'])}>
                  {serviceStatus['billing']}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Microservices Data Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Microservices Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="medical-records" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Medical Records
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Prescriptions
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="medical-records" className="mt-6">
              <MedicalRecordsTable
                onViewRecord={(record) => {
                  console.log('View medical record:', record);
                  // TODO: Implement view modal
                }}
                onEditRecord={(record) => {
                  console.log('Edit medical record:', record);
                  // TODO: Implement edit modal
                }}
                onDeleteRecord={(recordId) => {
                  console.log('Delete medical record:', recordId);
                  // TODO: Implement delete confirmation
                }}
                onCreateRecord={() => {
                  console.log('Create new medical record');
                  // TODO: Implement create modal
                }}
              />
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-6">
              <PrescriptionsTable
                onViewPrescription={(prescription) => {
                  console.log('View prescription:', prescription);
                  // TODO: Implement view modal
                }}
                onEditPrescription={(prescription) => {
                  console.log('Edit prescription:', prescription);
                  // TODO: Implement edit modal
                }}
                onDeletePrescription={(prescriptionId) => {
                  console.log('Delete prescription:', prescriptionId);
                  // TODO: Implement delete confirmation
                }}
                onCreatePrescription={() => {
                  console.log('Create new prescription');
                  // TODO: Implement create modal
                }}
              />
            </TabsContent>

            <TabsContent value="billing" className="mt-6">
              <BillingTable
                onViewBill={(bill) => {
                  console.log('View bill:', bill);
                  // TODO: Implement view modal
                }}
                onEditBill={(bill) => {
                  console.log('Edit bill:', bill);
                  // TODO: Implement edit modal
                }}
                onDeleteBill={(billId) => {
                  console.log('Delete bill:', billId);
                  // TODO: Implement delete confirmation
                }}
                onCreateBill={() => {
                  console.log('Create new bill');
                  // TODO: Implement create modal
                }}
                onPayBill={(bill) => {
                  console.log('Pay bill:', bill);
                  // TODO: Implement payment modal
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MicroservicesPage() {
  return (
    <AdminPageWrapper title="Microservices Integration" activePage="microservices-dashboard">
      <MicroservicesPageContent />
    </AdminPageWrapper>
  );
}
