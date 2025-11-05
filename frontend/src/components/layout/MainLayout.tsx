"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "./Dashboard";
import { PatientManagement } from "../patient/PatientManagement";
import { AppointmentManagement } from "../patient/AppointmentManagement";
import { UserManagement } from "../admin/UserManagement";
import { DoctorManagement } from "../doctor/DoctorManagement";
import { BillingManagement } from "../billing/BillingManagement";
import { ReportsManagement } from "../admin/ReportsManagement";
import { SettingsManagement } from "../admin/SettingsManagement";
import { PrescriptionManagement } from "../doctor/PrescriptionManagement";
import { MedicalRecordsManagement } from "../patient/MedicalRecordsManagement";
import { ScheduleManagement } from "../doctor/ScheduleManagement";
import { QueueManagement } from "../patient/QueueManagement";
import { DatabaseManagement } from "../admin/DatabaseManagement";
import { StaffScheduleManagement } from "../doctor/StaffScheduleManagement";
import { EquipmentManagement } from "../admin/EquipmentManagement";
import { useAuth } from "../auth/AuthContext";

// Placeholder components for other pages

export function MainLayout() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const { user } = useAuth();

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "users":
        return <UserManagement />;
      case "doctors":
        return <DoctorManagement />;
      case "patients":
        return <PatientManagement />;
      case "appointments":
        return <AppointmentManagement />;
      case "medical-records":
        return <MedicalRecordsManagement />;
      case "prescriptions":
        return <PrescriptionManagement />;
      case "billing":
        return <BillingManagement />;
      case "reports":
        return <ReportsManagement />;
      case "settings":
        return <SettingsManagement />;
      case "queue":
        return <QueueManagement />;
      case "schedule":
        return <ScheduleManagement />;
      case "staff-schedule":
        return <StaffScheduleManagement />;
      case "equipment":
        return <EquipmentManagement />;
      case "database":
        return <DatabaseManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto">{renderContent()}</main>
    </div>
  );
}
