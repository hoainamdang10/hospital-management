'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageWrapper } from '../page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrescriptionsTable } from '@/components/features/prescriptions/PrescriptionsTable';
import { prescriptionsApi, Prescription, Medication } from '@/lib/api/prescriptions';
import {
  Pill,
  Plus,
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PrescriptionStats {
  totalPrescriptions: number;
  pendingPrescriptions: number;
  dispensedPrescriptions: number;
  totalRevenue: number;
  prescriptionsByMonth: { month: string; count: number; revenue: number }[];
  topMedications: { medication: string; count: number; revenue: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
}

function PrescriptionsPageContent() {
  const [stats, setStats] = useState<PrescriptionStats>({
    totalPrescriptions: 0,
    pendingPrescriptions: 0,
    dispensedPrescriptions: 0,
    totalRevenue: 0,
    prescriptionsByMonth: [],
    topMedications: [],
    statusDistribution: []
  });
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // Fetch statistics and data
  const fetchData = async () => {
    try {
      const [prescriptionsResponse, medicationsResponse] = await Promise.all([
        prescriptionsApi.getAllPrescriptions(),
        prescriptionsApi.getAllMedications()
      ]);

      if (prescriptionsResponse.success && prescriptionsResponse.data) {
        const prescriptions = prescriptionsResponse.data;

        // Calculate statistics
        const totalPrescriptions = prescriptions.length;
        const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending').length;
        const dispensedPrescriptions = prescriptions.filter(p => p.status === 'dispensed').length;
        const totalRevenue = prescriptions.reduce((sum, p) => sum + p.total_cost, 0);

        // Prescriptions by month (last 6 months)
        const prescriptionsByMonth = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

          const monthPrescriptions = prescriptions.filter(p => {
            const prescriptionDate = new Date(p.prescription_date);
            return prescriptionDate.getMonth() === date.getMonth() &&
                   prescriptionDate.getFullYear() === date.getFullYear();
          });

          const count = monthPrescriptions.length;
          const revenue = monthPrescriptions.reduce((sum, p) => sum + p.total_cost, 0);

          prescriptionsByMonth.push({ month: monthName, count, revenue });
        }

        // Status distribution
        const statusCounts = prescriptions.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          percentage: (count / totalPrescriptions) * 100
        }));

        // Top medications (mock data - would need to aggregate from prescription items)
        const topMedications = [
          { medication: 'Amoxicillin 500mg', count: 45, revenue: 2250 },
          { medication: 'Ibuprofen 400mg', count: 38, revenue: 1140 },
          { medication: 'Metformin 850mg', count: 32, revenue: 1920 },
          { medication: 'Lisinopril 10mg', count: 28, revenue: 1680 },
          { medication: 'Atorvastatin 20mg', count: 25, revenue: 1875 }
        ];

        setStats({
          totalPrescriptions,
          pendingPrescriptions,
          dispensedPrescriptions,
          totalRevenue,
          prescriptionsByMonth,
          topMedications,
          statusDistribution
        });
      }

      if (medicationsResponse.success && medicationsResponse.data) {
        setMedications(medicationsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching prescription data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    // TODO: Open edit modal
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    if (confirm('Are you sure you want to delete this prescription?')) {
      try {
        const response = await prescriptionsApi.deletePrescription(prescriptionId);
        if (response.success) {
          fetchData(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting prescription:', error);
      }
    }
  };

  const handleCreatePrescription = () => {
    // TODO: Open create modal
  };

  const searchMedications = async () => {
    if (searchQuery.trim()) {
      try {
        const response = await prescriptionsApi.searchMedications(searchQuery);
        if (response.success && response.data) {
          setMedications(response.data);
        }
      } catch (error) {
        console.error('Error searching medications:', error);
      }
    } else {
      // Reset to all medications
      const response = await prescriptionsApi.getAllMedications();
      if (response.success && response.data) {
        setMedications(response.data);
      }
    }
  };

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescription Management</h1>
          <p className="text-gray-600 mt-2">
            Manage prescriptions, medications, and drug interactions
          </p>
        </div>
        <Button onClick={handleCreatePrescription} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Prescription
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
                <p className="text-2xl font-bold">{stats.totalPrescriptions}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Pill className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingPrescriptions}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dispensed</p>
                <p className="text-2xl font-bold text-green-600">{stats.dispensedPrescriptions}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prescription Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Prescription Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.prescriptionsByMonth.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">{item.count} prescriptions</span>
                      <span className="text-sm font-medium text-green-600">${item.revenue.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max((item.count / Math.max(...stats.prescriptionsByMonth.map(r => r.count))) * 100, 5)}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.statusDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <span className="text-sm font-medium">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="prescriptions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions">
          <PrescriptionsTable
            onViewPrescription={handleViewPrescription}
            onEditPrescription={handleEditPrescription}
            onDeletePrescription={handleDeletePrescription}
            onCreatePrescription={handleCreatePrescription}
          />
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Medication Database</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search medications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Button onClick={searchMedications} size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medications.slice(0, 12).map((medication) => (
                  <Card key={medication.id} className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">{medication.name}</h3>
                      <p className="text-sm text-gray-600">{medication.generic_name}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{medication.category}</Badge>
                        <span className="text-sm font-medium">${medication.price_per_unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Stock: {medication.stock_quantity}</span>
                        {medication.requires_prescription && (
                          <Badge variant="secondary" className="text-xs">Rx</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Medications by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topMedications.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{item.medication}</p>
                        <p className="text-sm text-gray-600">{item.count} prescriptions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">${item.revenue}</p>
                      <p className="text-sm text-gray-600">${(item.revenue / item.count).toFixed(2)} avg</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PrescriptionsPage() {
  return (
    <AdminPageWrapper title="Prescriptions" activePage="prescriptions">
      <PrescriptionsPageContent />
    </AdminPageWrapper>
  );
}
