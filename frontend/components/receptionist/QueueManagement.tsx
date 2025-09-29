'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Users, 
  UserCheck, 
  AlertCircle,
  Search,
  Phone,
  CheckCircle
} from 'lucide-react';

interface QueueItem {
  id: string;
  appointmentId: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  appointmentTime: string;
  queuePosition: number;
  estimatedWaitTime: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  checkedInAt?: string;
  insuranceVerified: boolean;
  documentsComplete: boolean;
}

interface QueueStats {
  totalWaiting: number;
  averageWaitTime: number;
  completedToday: number;
  currentlyInProgress: number;
}

export function QueueManagement() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats>({
    totalWaiting: 0,
    averageWaitTime: 0,
    completedToday: 0,
    currentlyInProgress: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueueData();
    // Setup real-time updates
    const interval = setInterval(fetchQueueData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueueData = async () => {
    try {
      const response = await fetch('/api/receptionist/queue');
      const data = await response.json();
      setQueueItems(data.queueItems || []);
      setQueueStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      const response = await fetch('/api/receptionist/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      
      if (response.ok) {
        fetchQueueData(); // Refresh queue
      }
    } catch (error) {
      console.error('Error checking in patient:', error);
    }
  };

  const handleCallNext = async (appointmentId: string) => {
    try {
      const response = await fetch('/api/receptionist/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      
      if (response.ok) {
        fetchQueueData(); // Refresh queue
      }
    } catch (error) {
      console.error('Error calling next patient:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredQueue = queueItems.filter(item =>
    item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading queue...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Đang chờ</p>
                <p className="text-2xl font-bold">{queueStats.totalWaiting}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Thời gian chờ TB</p>
                <p className="text-2xl font-bold">{queueStats.averageWaitTime}p</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Hoàn thành hôm nay</p>
                <p className="text-2xl font-bold">{queueStats.completedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Đang khám</p>
                <p className="text-2xl font-bold">{queueStats.currentlyInProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Hàng đợi khám bệnh</span>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm bệnh nhân..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={fetchQueueData} variant="outline">
                Làm mới
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredQueue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không có bệnh nhân trong hàng đợi
              </div>
            ) : (
              filteredQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold">
                      {item.queuePosition}
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{item.patientName}</h4>
                      <p className="text-sm text-gray-600">ID: {item.patientId}</p>
                      <p className="text-sm text-gray-600">BS: {item.doctorName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.appointmentTime}</p>
                      <p className="text-sm text-gray-600">
                        Chờ: {item.estimatedWaitTime} phút
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.insuranceVerified && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          BHYT
                        </Badge>
                      )}
                      
                      <Badge className={getStatusColor(item.status)}>
                        {item.status === 'waiting' && 'Đang chờ'}
                        {item.status === 'in_progress' && 'Đang khám'}
                        {item.status === 'completed' && 'Hoàn thành'}
                        {item.status === 'cancelled' && 'Đã hủy'}
                      </Badge>
                    </div>

                    <div className="flex space-x-2">
                      {item.status === 'waiting' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(item.appointmentId)}
                            variant="outline"
                          >
                            Check-in
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCallNext(item.appointmentId)}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Gọi
                          </Button>
                        </>
                      )}
                      
                      {item.status === 'in_progress' && (
                        <Button size="sm" variant="outline" disabled>
                          Đang khám
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
