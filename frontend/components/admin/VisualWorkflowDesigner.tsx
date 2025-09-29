import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus,
  Save,
  Play,
  Settings,
  Trash2,
  Copy,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Users,
  Mail,
  FileText,
  Workflow
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'service_call' | 'validation' | 'notification' | 'data_transform' | 'condition';
  service: string;
  action: string;
  config: {
    timeout?: number;
    retries?: number;
    compensationAction?: string;
    condition?: string;
    parameters?: Record<string, any>;
  };
  position: { x: number; y: number };
  connections: string[]; // IDs of connected steps
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  metadata: {
    category: string;
    estimatedDuration: number;
    complexity: 'simple' | 'medium' | 'complex';
  };
}

const STEP_TYPES = [
  { type: 'service_call', icon: Database, label: 'Service Call', color: 'bg-blue-100 text-blue-800' },
  { type: 'validation', icon: CheckCircle, label: 'Validation', color: 'bg-green-100 text-green-800' },
  { type: 'notification', icon: Mail, label: 'Notification', color: 'bg-purple-100 text-purple-800' },
  { type: 'data_transform', icon: FileText, label: 'Data Transform', color: 'bg-orange-100 text-orange-800' },
  { type: 'condition', icon: AlertTriangle, label: 'Condition', color: 'bg-yellow-100 text-yellow-800' }
];

const WORKFLOW_TEMPLATES = [
  {
    id: 'create_doctor',
    name: 'Create Doctor Workflow',
    description: 'Complete doctor creation with department assignment',
    category: 'User Management',
    estimatedDuration: 30,
    complexity: 'medium' as const
  },
  {
    id: 'bulk_import',
    name: 'Bulk User Import',
    description: 'Import multiple users with validation and notifications',
    category: 'Data Management',
    estimatedDuration: 120,
    complexity: 'complex' as const
  },
  {
    id: 'system_maintenance',
    name: 'System Maintenance',
    description: 'Automated system maintenance workflow',
    category: 'System Operations',
    estimatedDuration: 60,
    complexity: 'simple' as const
  }
];

export default function VisualWorkflowDesigner() {
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowTemplate | null>(null);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [draggedStepType, setDraggedStepType] = useState<string | null>(null);
  const [isDesigning, setIsDesigning] = useState(false);

  const createNewWorkflow = () => {
    const newWorkflow: WorkflowTemplate = {
      id: `workflow_${Date.now()}`,
      name: 'New Workflow',
      description: 'Custom workflow description',
      steps: [],
      metadata: {
        category: 'Custom',
        estimatedDuration: 0,
        complexity: 'simple'
      }
    };
    setCurrentWorkflow(newWorkflow);
    setIsDesigning(true);
  };

  const loadTemplate = (templateId: string) => {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      // Load predefined steps for the template
      const steps = generateTemplateSteps(templateId);
      setCurrentWorkflow({
        ...template,
        steps
      });
      setIsDesigning(true);
    }
  };

  const generateTemplateSteps = (templateId: string): WorkflowStep[] => {
    switch (templateId) {
      case 'create_doctor':
        return [
          {
            id: 'step_1',
            name: 'Validate Department',
            type: 'validation',
            service: 'department-service',
            action: 'checkCapacity',
            config: { timeout: 5000, retries: 2 },
            position: { x: 100, y: 100 },
            connections: ['step_2']
          },
          {
            id: 'step_2',
            name: 'Create User Profile',
            type: 'service_call',
            service: 'auth-service',
            action: 'createUser',
            config: { 
              timeout: 10000, 
              retries: 3,
              compensationAction: 'deleteUser'
            },
            position: { x: 100, y: 200 },
            connections: ['step_3']
          },
          {
            id: 'step_3',
            name: 'Create Doctor Profile',
            type: 'service_call',
            service: 'doctor-service',
            action: 'createDoctor',
            config: { 
              timeout: 10000, 
              retries: 3,
              compensationAction: 'deleteDoctor'
            },
            position: { x: 100, y: 300 },
            connections: ['step_4']
          },
          {
            id: 'step_4',
            name: 'Send Welcome Email',
            type: 'notification',
            service: 'notification-service',
            action: 'sendWelcomeEmail',
            config: { timeout: 5000, retries: 1 },
            position: { x: 100, y: 400 },
            connections: []
          }
        ];
      default:
        return [];
    }
  };

  const addStep = (stepType: string, position: { x: number; y: number }) => {
    if (!currentWorkflow) return;

    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: `New ${stepType.replace('_', ' ')}`,
      type: stepType as WorkflowStep['type'],
      service: '',
      action: '',
      config: { timeout: 10000, retries: 3 },
      position,
      connections: []
    };

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: [...currentWorkflow.steps, newStep]
    });
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    if (!currentWorkflow) return;

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    });
  };

  const deleteStep = (stepId: string) => {
    if (!currentWorkflow) return;

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.filter(step => step.id !== stepId)
    });
    setSelectedStep(null);
  };

  const saveWorkflow = async () => {
    if (!currentWorkflow) return;

    try {
      await fetch('/api/admin/orchestration/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentWorkflow)
      });
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    }
  };

  const executeWorkflow = async () => {
    if (!currentWorkflow) return;

    try {
      await fetch('/api/admin/orchestration/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: currentWorkflow.id })
      });
      alert('Workflow execution started!');
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      alert('Failed to execute workflow');
    }
  };

  const getStepIcon = (type: string) => {
    const stepType = STEP_TYPES.find(st => st.type === type);
    return stepType ? stepType.icon : Database;
  };

  const getStepColor = (type: string) => {
    const stepType = STEP_TYPES.find(st => st.type === type);
    return stepType ? stepType.color : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Designer Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Workflow className="h-6 w-6 mr-2 text-blue-600" />
            Visual Workflow Designer
          </h2>
          <p className="text-gray-600">
            Design and customize admin workflow processes
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createNewWorkflow} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
          {currentWorkflow && (
            <>
              <Button onClick={saveWorkflow} variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={executeWorkflow} size="sm">
                <Play className="h-4 w-4 mr-2" />
                Execute
              </Button>
            </>
          )}
        </div>
      </div>

      {!isDesigning ? (
        /* Workflow Templates */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORKFLOW_TEMPLATES.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {template.name}
                  <Badge variant="outline">{template.complexity}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{template.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>Category: {template.category}</span>
                  <span>~{template.estimatedDuration}s</span>
                </div>
                <Button 
                  onClick={() => loadTemplate(template.id)}
                  className="w-full"
                  size="sm"
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Workflow Designer Interface */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Step Palette */}
          <Card>
            <CardHeader>
              <CardTitle>Step Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {STEP_TYPES.map((stepType) => {
                  const Icon = stepType.icon;
                  return (
                    <div
                      key={stepType.type}
                      draggable
                      onDragStart={() => setDraggedStepType(stepType.type)}
                      className="flex items-center space-x-2 p-2 border rounded cursor-move hover:bg-gray-50"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{stepType.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Workflow Canvas */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {currentWorkflow?.name || 'Workflow Canvas'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="relative h-96 border-2 border-dashed border-gray-200 rounded-lg overflow-auto"
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedStepType) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const position = {
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top
                    };
                    addStep(draggedStepType, position);
                    setDraggedStepType(null);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {currentWorkflow?.steps.map((step) => {
                  const Icon = getStepIcon(step.type);
                  return (
                    <div
                      key={step.id}
                      className={`absolute p-3 border rounded-lg cursor-pointer ${
                        selectedStep === step.id ? 'ring-2 ring-blue-500' : ''
                      } bg-white shadow-sm hover:shadow-md transition-shadow`}
                      style={{ 
                        left: step.position.x, 
                        top: step.position.y,
                        minWidth: '120px'
                      }}
                      onClick={() => setSelectedStep(step.id)}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon className="h-4 w-4" />
                        <Badge className={getStepColor(step.type)} variant="outline">
                          {step.type}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">{step.name}</div>
                      <div className="text-xs text-gray-500">{step.service}</div>
                      
                      {/* Connection arrows */}
                      {step.connections.map((connectionId) => {
                        const connectedStep = currentWorkflow.steps.find(s => s.id === connectionId);
                        if (connectedStep) {
                          return (
                            <div key={connectionId} className="absolute">
                              <ArrowDown className="h-4 w-4 text-gray-400" />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                })}
                
                {currentWorkflow?.steps.length === 0 && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Workflow className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Drag step types here to build your workflow</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Step Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedStep && currentWorkflow ? (
                <div className="space-y-4">
                  {(() => {
                    const step = currentWorkflow.steps.find(s => s.id === selectedStep);
                    if (!step) return null;

                    return (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Name</label>
                          <input
                            type="text"
                            value={step.name}
                            onChange={(e) => updateStep(step.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Service</label>
                          <select
                            value={step.service}
                            onChange={(e) => updateStep(step.id, { service: e.target.value })}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Service</option>
                            <option value="auth-service">Auth Service</option>
                            <option value="doctor-service">Doctor Service</option>
                            <option value="patient-service">Patient Service</option>
                            <option value="department-service">Department Service</option>
                            <option value="notification-service">Notification Service</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Action</label>
                          <input
                            type="text"
                            value={step.action}
                            onChange={(e) => updateStep(step.id, { action: e.target.value })}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Timeout (ms)</label>
                          <input
                            type="number"
                            value={step.config.timeout || 10000}
                            onChange={(e) => updateStep(step.id, { 
                              config: { ...step.config, timeout: parseInt(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Max Retries</label>
                          <input
                            type="number"
                            value={step.config.retries || 3}
                            onChange={(e) => updateStep(step.id, { 
                              config: { ...step.config, retries: parseInt(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              // Copy step logic
                              const newStep = { 
                                ...step, 
                                id: `step_${Date.now()}`,
                                position: { x: step.position.x + 20, y: step.position.y + 20 }
                              };
                              setCurrentWorkflow({
                                ...currentWorkflow,
                                steps: [...currentWorkflow.steps, newStep]
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteStep(step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Select a step to edit its properties</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
