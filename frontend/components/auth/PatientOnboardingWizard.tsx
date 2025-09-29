'use client'

/**
 * Patient Onboarding Wizard (Step 2)
 * Multi-step form for completing patient profile after email verification
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { patientOnboardingSchema, type PatientOnboardingInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  MapPin, 
  Shield, 
  Heart, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Home,
  FileText,
  Plus,
  X
} from 'lucide-react'

interface PatientOnboardingWizardProps {
  onSuccess?: () => void
  className?: string
}

type WizardStep = 'contact' | 'address' | 'emergency' | 'medical' | 'documents' | 'review'

export function PatientOnboardingWizard({ onSuccess, className }: PatientOnboardingWizardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<WizardStep>('contact')
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())
  const [allergies, setAllergies] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [newAllergy, setNewAllergy] = useState('')
  const [newCondition, setNewCondition] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
    getValues,
  } = useForm<PatientOnboardingInput>({
    resolver: zodResolver(patientOnboardingSchema),
    mode: 'onChange',
    defaultValues: {
      preferred_language: 'vi',
      contact_channel: 'email',
      address: {
        country: 'VN',
      },
    },
  })

  const steps: Array<{
    id: WizardStep
    title: string
    description: string
    icon: React.ReactNode
    required: boolean
  }> = [
    {
      id: 'contact',
      title: 'Thông tin liên lạc',
      description: 'Số điện thoại và ngôn ngữ ưa thích',
      icon: <Phone className="h-5 w-5" />,
      required: true,
    },
    {
      id: 'address',
      title: 'Địa chỉ',
      description: 'Địa chỉ nơi ở hiện tại',
      icon: <Home className="h-5 w-5" />,
      required: true,
    },
    {
      id: 'emergency',
      title: 'Liên hệ khẩn cấp',
      description: 'Người liên hệ khi có tình huống khẩn cấp',
      icon: <Shield className="h-5 w-5" />,
      required: true,
    },
    {
      id: 'medical',
      title: 'Thông tin y khoa',
      description: 'Dị ứng, bệnh lý và nhóm máu',
      icon: <Heart className="h-5 w-5" />,
      required: false,
    },
    {
      id: 'documents',
      title: 'Tài liệu',
      description: 'CCCD và thẻ bảo hiểm y tế',
      icon: <FileText className="h-5 w-5" />,
      required: false,
    },
    {
      id: 'review',
      title: 'Xem lại',
      description: 'Kiểm tra và hoàn tất',
      icon: <CheckCircle className="h-5 w-5" />,
      required: true,
    },
  ]

  const handleStepNext = async () => {
    const currentStepIndex = steps.findIndex(step => step.id === currentStep)
    const nextStep = steps[currentStepIndex + 1]

    // Validate current step
    let fieldsToValidate: string[] = []
    switch (currentStep) {
      case 'contact':
        fieldsToValidate = ['phone', 'preferred_language', 'contact_channel']
        break
      case 'address':
        fieldsToValidate = ['address.line1', 'address.city']
        break
      case 'emergency':
        fieldsToValidate = ['emergency_contact.name', 'emergency_contact.relation', 'emergency_contact.phone']
        break
    }

    if (fieldsToValidate.length > 0) {
      const isStepValid = await trigger(fieldsToValidate as any)
      if (!isStepValid) return
    }

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]))

    if (nextStep) {
      setCurrentStep(nextStep.id)
    }
  }

  const handleStepBack = () => {
    const currentStepIndex = steps.findIndex(step => step.id === currentStep)
    const prevStep = steps[currentStepIndex - 1]
    if (prevStep) {
      setCurrentStep(prevStep.id)
    }
  }

  const handleStepClick = (stepId: WizardStep) => {
    const stepIndex = steps.findIndex(step => step.id === stepId)
    const currentStepIndex = steps.findIndex(step => step.id === currentStep)
    
    // Only allow going to previous steps or next immediate step
    if (stepIndex <= currentStepIndex || completedSteps.has(stepId)) {
      setCurrentStep(stepId)
    }
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      const updatedAllergies = [...allergies, newAllergy.trim()]
      setAllergies(updatedAllergies)
      setValue('medical_info.allergies', updatedAllergies)
      setNewAllergy('')
    }
  }

  const removeAllergy = (index: number) => {
    const updatedAllergies = allergies.filter((_, i) => i !== index)
    setAllergies(updatedAllergies)
    setValue('medical_info.allergies', updatedAllergies)
  }

  const addCondition = () => {
    if (newCondition.trim() && !conditions.includes(newCondition.trim())) {
      const updatedConditions = [...conditions, newCondition.trim()]
      setConditions(updatedConditions)
      setValue('medical_info.chronic_conditions', updatedConditions)
      setNewCondition('')
    }
  }

  const removeCondition = (index: number) => {
    const updatedConditions = conditions.filter((_, i) => i !== index)
    setConditions(updatedConditions)
    setValue('medical_info.chronic_conditions', updatedConditions)
  }

  const onSubmit = async (data: PatientOnboardingInput) => {
    setIsLoading(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setSubmitError(`Quá nhiều yêu cầu. Vui lòng thử lại sau ${result.retryAfter} giây.`)
        } else {
          setSubmitError(result.error || 'Hoàn tất onboarding thất bại')
        }
        return
      }

      if (result.success) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/patient?message=onboarding_complete')
        }
      } else {
        setSubmitError(result.error || 'Hoàn tất onboarding thất bại')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      setSubmitError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderContactStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Phone className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h3 className="text-xl font-semibold">Thông tin liên lạc</h3>
        <p className="text-gray-600">Cung cấp thông tin để chúng tôi có thể liên lạc với bạn</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="0901234567"
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="preferred_language">Ngôn ngữ ưa thích</Label>
          <Select onValueChange={(value) => setValue('preferred_language', value as 'vi' | 'en')}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn ngôn ngữ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contact_channel">Phương thức liên lạc ưa thích</Label>
          <Select onValueChange={(value) => setValue('contact_channel', value as 'sms' | 'email' | 'both')}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn phương thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="both">Cả hai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 'contact': return renderContactStep()
      // Add other steps here...
      default: return <div>Step content for {currentStep}</div>
    }
  }

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-center">Hoàn thiện hồ sơ bệnh nhân</CardTitle>
        <CardDescription className="text-center">
          Cung cấp thông tin chi tiết để chúng tôi phục vụ bạn tốt hơn
        </CardDescription>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Step indicators */}
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                step.id === currentStep
                  ? 'bg-blue-100 text-blue-700'
                  : completedSteps.has(step.id)
                  ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={index > currentStepIndex && !completedSteps.has(step.id)}
            >
              <div className={`p-2 rounded-full ${
                step.id === currentStep
                  ? 'bg-blue-600 text-white'
                  : completedSteps.has(step.id)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {step.icon}
              </div>
              <span className="text-xs font-medium hidden sm:block">{step.title}</span>
              {step.required && (
                <span className="text-xs text-red-500">*</span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {renderStepContent()}

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between space-x-4">
            {currentStepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleStepBack}
                disabled={isLoading}
                className="flex-1"
              >
                Quay lại
              </Button>
            )}

            {currentStep !== 'review' ? (
              <Button
                type="button"
                onClick={handleStepNext}
                disabled={isLoading}
                className="flex-1"
              >
                {currentStep === 'documents' ? 'Bỏ qua' : 'Tiếp tục'}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang hoàn tất...
                  </>
                ) : (
                  'Hoàn tất onboarding'
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
