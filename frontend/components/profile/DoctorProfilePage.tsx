"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Star,
  Users,
  Activity,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Stethoscope,
  Award,
  BookOpen,
  MessageSquare,
  AlertCircle
} from "lucide-react"
import { DoctorProfileData, AppointmentStats, ScheduleItem, Review, WorkExperience } from '@/lib/types'
import { useDoctorProfile } from '@/hooks/useDoctorProfile'

// Interfaces moved to types file

interface DoctorProfilePageProps {
  doctorId: string
  onBack?: () => void
}

export function DoctorProfilePage({ doctorId, onBack }: DoctorProfilePageProps) {
  const {
    doctor,
    appointmentStats,
    todaySchedule,
    reviews,
    experiences,
    loading,
    error,
    refetch
  } = useDoctorProfile(doctorId)

  const [currentWeek, setCurrentWeek] = useState(0)


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Doctor Profile</h2>
          <p className="text-gray-600 mt-2">Please wait while we fetch the doctor information...</p>
        </div>
      </div>
    )
  }

  if (error && !doctor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Error Loading Profile</h2>
          <p className="text-gray-600 mt-2 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Doctor not found</h2>
          <p className="text-gray-600 mt-2">The requested doctor profile could not be loaded.</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            Back to Doctor List
          </Button>
        </div>
      </div>
    )
  }

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') return 'DR'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Doctor List
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Layout - Left Sidebar + Right Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Doctor Profile */}
          <div className="lg:col-span-1 space-y-6">
            {/* Doctor Profile Card */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                {/* Doctor Avatar and Basic Info */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="h-20 w-20 mx-auto mb-4 bg-teal-100">
                      <AvatarImage
                        src={doctor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor?.full_name || 'doctor'}`}
                        alt={doctor?.full_name || 'Doctor'}
                      />
                      <AvatarFallback className="text-lg bg-teal-100 text-teal-600">
                        {getInitials(doctor?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    {doctor?.full_name || 'Loading...'}
                  </h2>
                  <p className="text-sm text-gray-500 mb-3">
                    {doctor?.doctor_id || 'Loading...'}
                  </p>

                  <Badge
                    variant="secondary"
                    className={`text-xs px-2 py-1 ${
                      doctor?.availability_status === 'available'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      doctor?.availability_status === 'available'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}></div>
                    {doctor?.availability_status === 'available' ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>

                {/* Specialist Section */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">Specialist</h3>
                  <p className="text-sm text-gray-600">
                    {doctor?.specialty || 'Loading...'}
                  </p>
                </div>

                {/* About Section */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">About</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {doctor?.bio || 'Loading doctor information...'}
                  </p>
                </div>

                {/* Contact Information */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-teal-500" />
                    <span className="text-gray-600">
                      {doctor?.phone_number || 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-teal-500" />
                    <span className="text-gray-600">
                      {doctor?.email || 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-teal-500" />
                    <span className="text-gray-600">
                      {doctor?.address ?
                        `${doctor.address.street}, ${doctor.address.district}, ${doctor.address.city}` :
                        'Loading address...'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Experience Card */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                  <Award className="h-4 w-4 text-teal-500" />
                  Work Experience
                  <Button variant="ghost" size="sm" className="ml-auto p-1">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {experiences.length > 0 ? (
                  experiences.map((exp, index) => (
                    <div key={exp.id || `experience-${index}`} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        exp.type === 'work' ? 'bg-teal-100' :
                        exp.type === 'education' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {exp.type === 'work' ? (
                          <Stethoscope className={`h-4 w-4 ${
                            exp.type === 'work' ? 'text-teal-600' :
                            exp.type === 'education' ? 'text-blue-600' : 'text-purple-600'
                          }`} />
                        ) : exp.type === 'education' ? (
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Award className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{exp.position}</h4>
                        <p className="text-sm text-gray-600">{exp.organization}</p>
                        <p className="text-xs text-gray-500">
                          {exp.is_current ? 'Full Time' : 'Part Time'} • {
                            new Date(exp.start_date).getFullYear()} - {
                            exp.is_current ? 'Present' : new Date(exp.end_date!).getFullYear()
                          }
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No work experience data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Patients Card */}
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Patients</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {doctor?.total_patients || appointmentStats?.total_unique_patients || '0'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-teal-600" />
                    </div>
                    <Button variant="ghost" size="sm" className="p-1">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Total Appointments Card */}
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Appointments</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {doctor?.total_appointments || appointmentStats?.total_appointments || '0'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-teal-600" />
                    </div>
                    <Button variant="ghost" size="sm" className="p-1">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Card */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-900">Schedule</CardTitle>
                  <Button variant="ghost" size="sm" className="p-1">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Mini Calendar */}
                  <div className="mb-4">
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <div key={index} className="text-gray-400 font-medium">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {Array.from({ length: 35 }, (_, i) => {
                        const day = i - 10; // Offset to show current month
                        const isToday = day === 20;
                        const isCurrentMonth = day > 0 && day <= 31;
                        return (
                          <div
                            key={i}
                            className={`h-6 w-6 flex items-center justify-center rounded ${
                              isToday
                                ? 'bg-slate-700 text-white font-semibold'
                                : isCurrentMonth
                                ? 'text-gray-700 hover:bg-gray-100'
                                : 'text-gray-300'
                            }`}
                          >
                            {isCurrentMonth ? day : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Today's Schedule */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">5 schedules today</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                        <span className="text-gray-700">Rupert Twinny</span>
                        <span className="text-gray-500 ml-auto">09:00 AM</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                        <span className="text-gray-700">Ruth Herdinger</span>
                        <span className="text-gray-500 ml-auto">10:00 AM</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                        <span className="text-gray-700">Caren G. Simpson</span>
                        <span className="text-gray-500 ml-auto">11:00 AM</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row - Appointment Stats and Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointment Stats Chart */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Appointment Stats</CardTitle>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs">
                    Wed, 12 Jul 24
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Chart Legend */}
                  <div className="flex items-center gap-4 mb-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                      <span className="text-gray-600">New Patient</span>
                      <span className="font-semibold text-gray-900">{appointmentStats?.new_patients || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      <span className="text-gray-600">Follow-up Patient</span>
                      <span className="font-semibold text-gray-900">{appointmentStats?.follow_up_patients || 0}</span>
                    </div>
                  </div>

                  {/* Bar Chart - Simple representation */}
                  <div className="flex items-end justify-between gap-2 h-32 mb-4">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      // Simple calculation based on total stats
                      const newPatients = Math.floor((appointmentStats?.new_patients || 0) / 7);
                      const followUpPatients = Math.floor((appointmentStats?.follow_up_patients || 0) / 7);
                      return (
                        <div key={day} className="flex flex-col items-center gap-2">
                          <div className="flex flex-col items-center justify-end h-24 gap-1">
                            <div
                              className="bg-slate-700 rounded-t-sm w-6"
                              style={{ height: `${Math.min(newPatients * 20, 100)}%` }}
                            ></div>
                            <div
                              className="bg-teal-400 rounded-t-sm w-6"
                              style={{ height: `${Math.min(followUpPatients * 20, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{day}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{appointmentStats?.total_appointments || 0}</div>
                      <div className="text-xs text-gray-500">Total Appointments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{appointmentStats?.new_patients || 0}</div>
                      <div className="text-xs text-gray-500">New Patients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{appointmentStats?.follow_up_patients || 0}</div>
                      <div className="text-xs text-gray-500">Follow-Up Patients</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Section */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Feedback</CardTitle>
                  <Button variant="ghost" size="sm" className="p-1">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Feedback Item 1 */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 bg-slate-700">
                        <AvatarFallback className="text-white text-sm">AJ</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">Alice Johnson</h4>
                          <span className="text-xs text-gray-500">2024-07-01</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Dr. Winsbury is very thorough and caring. He took the time to explain my condition and treatment options in detail. I felt very comfortable and well cared for during my visit.
                        </p>
                      </div>
                    </div>

                    {/* Feedback Item 2 */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 bg-teal-500">
                        <AvatarFallback className="text-white text-sm">RB</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">Robert Brown</h4>
                          <span className="text-xs text-gray-500">2024-06-25</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Great experience, highly recommend Dr. Winsbury. He is attentive and professional, ensuring that all my questions were answered. His expertise would make him a great doctor.
                        </p>
                      </div>
                    </div>

                    {/* Feedback Item 3 */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 bg-blue-500">
                        <AvatarFallback className="text-white text-sm">CS</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">Chance Siphron</h4>
                          <span className="text-xs text-gray-500">2024-06-11</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Dr. Winsbury is efficient, professional, and skilled. He quickly diagnosed my issue, provided a clear treatment plan, and I'm happy with the positive outcome. I highly recommend him.
                        </p>
                      </div>
                    </div>

                    {/* Feedback Item 4 */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 bg-green-600">
                        <AvatarFallback className="text-white text-sm">LD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">Lincoln Donin</h4>
                          <span className="text-xs text-gray-500">2024-05-27</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Dr. Winsbury is an exceptional physician who combines deep knowledge with genuine care, addressing all concerns and making patients feel understood.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
