import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database,
  Play,
  Pause,
  Square,
  RotateCcw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Filter,
  Search,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

interface SagaStep {
  id: string;
  name: string;
  service: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'compensated';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  compensationAction?: string;
  retryCount: number;
  maxRetries: number;
}

interface Saga {
  id: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | 'compensating' | 'paused';
  progress: number;
  createdAt: string;
  completedAt?: string;
  steps: SagaStep[];
  metadata: {
    userId: string;
    userEmail: string;
    operationId: string;
    priority: 'low' | 'medium' | 'high';
    retryPolicy: {
      maxRetries: number;
      backoffStrategy: 'linear' | 'exponential';
    };
  };
  executionTime?: number;
  compensationReason?: string;
}

export default function SagaManagementConsole() {
  const [sagas, setSagas] = useState<Saga[]>([]);
  const [selectedSaga, setSelectedSaga] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSagas();
    
    if (realTimeEnabled) {
      const ws = new WebSocket('ws://localhost:3000/api/admin/orchestration/sagas/ws');
      
      ws.onmessage = (event) => {
        const update = JSON.parse(event.data);
        
        switch (update.type) {
          case 'saga_update':
            setSagas(prev => 
              prev.map(saga => 
                saga.id === update.data.id ? { ...saga, ...update.data } : saga
              )
            );
            break;
          case 'saga_step_update':
            setSagas(prev => 
              prev.map(saga => 
                saga.id === update.data.sagaId 
                  ? {
                      ...saga,
                      steps: saga.steps.map(step =>
                        step.id === update.data.stepId 
                          ? { ...step, ...update.data.stepData }
                          : step
                      )
                    }
                  : saga
              )
            );
            break;
          case 'new_saga':
            setSagas(prev => [update.data, ...prev]);
            break;
        }
      };

      return () => ws.close();
    }
  }, [realTimeEnabled]);

  const fetchSagas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orchestration/sagas');
      const data = await response.json();
      setSagas(data.sagas || []);
    } catch (error) {
      console.error('Failed to fetch sagas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSagaControl = async (sagaId: string, action: 'pause' | 'resume' | 'cancel' | 'retry') => {
    try {
      await fetch(`/api/admin/orchestration/sagas/${sagaId}/${action}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error(`Failed to ${action} saga:`, error);
    }
  };

  const compensateSaga = async (sagaId: string, reason: string) => {
    try {
      await fetch(`/api/admin/orchestration/sagas/${sagaId}/compensate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error('Failed to compensate saga:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'compensating': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paused': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'compensated': return <RotateCcw className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSagas = sagas.filter(saga => {
    const matchesStatus = filterStatus === 'all' || saga.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      saga.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      saga.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      saga.metadata.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Saga Management Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="h-6 w-6 mr-2 text-blue-600" />
            Saga Management Console
          </h2>
          <p className="text-gray-600">
            Monitor and control distributed transaction workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={realTimeEnabled ? "default" : "outline"} 
            size="sm"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            <Zap className="h-4 w-4 mr-2" />
            {realTimeEnabled ? 'Live' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSagas}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sagas by ID, type, or user email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="compensating">Compensating</option>
              <option value="paused">Paused</option>
            </select>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saga List */}
      <div className="space-y-4">
        {filteredSagas.map((saga) => (
          <Card key={saga.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(saga.status)}>
                    {saga.status.toUpperCase()}
                  </Badge>
                  <h3 className="font-medium text-lg">
                    {saga.type.replace('_', ' ').toUpperCase()}
                  </h3>
                  <span className="text-sm text-gray-500">
                    ID: {saga.id.slice(-12)}
                  </span>
                  <Badge className={getPriorityColor(saga.metadata.priority)} variant="outline">
                    {saga.metadata.priority}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedSaga(
                      selectedSaga === saga.id ? null : saga.id
                    )}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {saga.status === 'running' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSagaControl(saga.id, 'pause')}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleSagaControl(saga.id, 'cancel')}
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {saga.status === 'paused' && (
                    <Button 
                      size="sm"
                      onClick={() => handleSagaControl(saga.id, 'resume')}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {saga.status === 'failed' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSagaControl(saga.id, 'retry')}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => compensateSaga(saga.id, 'Manual compensation')}
                      >
                        Compensate
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 font-medium">
                    {new Date(saga.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">User:</span>
                  <span className="ml-2 font-medium">{saga.metadata.userEmail}</span>
                </div>
                <div>
                  <span className="text-gray-500">Execution Time:</span>
                  <span className="ml-2 font-medium">
                    {saga.executionTime ? `${saga.executionTime}s` : 'In progress'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{saga.progress}%</span>
                </div>
                <Progress value={saga.progress} className="w-full" />
              </div>

              {saga.compensationReason && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Compensation Reason:</strong> {saga.compensationReason}
                  </AlertDescription>
                </Alert>
              )}

              {selectedSaga === saga.id && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Saga Steps Detail
                  </h4>
                  <div className="space-y-3">
                    {saga.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500">
                            {index + 1}
                          </span>
                          {getStepIcon(step.status)}
                          <div>
                            <div className="font-medium">{step.name}</div>
                            <div className="text-sm text-gray-500">{step.service}</div>
                            {step.error && (
                              <div className="text-sm text-red-600 mt-1">
                                Error: {step.error}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <Badge className={getStatusColor(step.status)} variant="outline">
                            {step.status}
                          </Badge>
                          {step.duration && (
                            <div className="text-gray-500 mt-1">
                              {step.duration}ms
                            </div>
                          )}
                          {step.retryCount > 0 && (
                            <div className="text-yellow-600 mt-1">
                              Retries: {step.retryCount}/{step.maxRetries}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSagas.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No sagas found matching your criteria</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
