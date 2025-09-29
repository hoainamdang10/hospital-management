"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { patientsApi } from "@/lib/supabase"

// Shared components
import { AdminPageWrapper } from "../page-wrapper"
import { SupabaseSearchableTable } from "@/components/data-display/SupabaseSearchableTable"
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog"

// UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/toast-provider"

export default function PatientsPage() {
  // State variables
  const [patients, setPatients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [isNewPatientDialogOpen, setIsNewPatientDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [patientToEdit, setPatientToEdit] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Toast notifications
  const { showToast } = useToast()

  // New patient state
  const [newPatient, setNewPatient] = useState({
    full_name: "",
    dateofbirth: "",
    registration_date: new Date().toISOString().split('T')[0],
    phone_number: "",
    email: "",
    blood_type: "",
    gender: "Male",
    address: "",
    allergies: "",
    chronic_diseases: "",
    insurance_info: ""
  })

  // Constants
  const patientsPerPage = 10
  const genderOptions = ["All", "Male", "Female", "Other"]
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch patients data from Supabase
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true)
      try {
        const data = await patientsApi.getAllPatients()
        setPatients(data)
      } catch (error) {
        console.error('Error fetching patients:', error)
        setPatients([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [])

  // Filter patients based on search term and gender filter
  const filteredPatients = patients.filter((patient) => {
    // Search filter
    const matchesSearch =
      (patient.full_name && patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.phone_number && patient.phone_number.toLowerCase().includes(searchTerm.toLowerCase()))

    // Gender filter
    const matchesGender = genderFilter === "All" || patient.gender === genderFilter

    return matchesSearch && matchesGender
  })

  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage)

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Handle new patient form
  const handleNewPatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewPatient({
      ...newPatient,
      [name]: value,
    })
  }

  const handleNewPatientSelectChange = (name: string, value: string) => {
    setNewPatient({
      ...newPatient,
      [name]: value,
    })
  }

  // Add new patient
  const handleAddNewPatient = async () => {
    try {
      // Validate required fields
      if (!newPatient.full_name) {
        showToast("Full name is required", undefined, "error")
        return
      }

      // Prepare patient data for Supabase
      const patientData = {
        full_name: newPatient.full_name,
        dateofbirth: newPatient.dateofbirth || null,
        registration_date: newPatient.registration_date,
        phone_number: newPatient.phone_number,
        email: newPatient.email,
        blood_type: newPatient.blood_type,
        gender: newPatient.gender,
        address: newPatient.address,
        allergies: newPatient.allergies,
        chronic_diseases: newPatient.chronic_diseases,
        insurance_info: newPatient.insurance_info
      }

      // Add patient to database
      const newPatientData = await patientsApi.addPatient(patientData)

      if (newPatientData) {
        // Refresh patients list
        const updatedPatients = await patientsApi.getAllPatients()
        setPatients(updatedPatients)

        // Show success toast
        showToast("Patient added successfully", "The patient has been added to the system.", "success")

        // Reset form and close dialog
        setNewPatient({
          full_name: "",
          dateofbirth: "",
          registration_date: new Date().toISOString().split('T')[0],
          phone_number: "",
          email: "",
          blood_type: "",
          gender: "Male",
          address: "",
          allergies: "",
          chronic_diseases: "",
          insurance_info: ""
        })
        setIsNewPatientDialogOpen(false)
      }
    } catch (error) {
      console.error('Error adding patient:', error)
      showToast("Error adding patient", error instanceof Error ? error.message : "An unknown error occurred", "error")
    }
  }

  // Delete patient
  const handleDeleteClick = (patientId: string) => {
    setPatientToDelete(patientId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (patientToDelete) {
      try {
        // Delete from database
        const success = await patientsApi.deletePatient(patientToDelete)

        if (success) {
          // Update UI
          setPatients(patients.filter((patient) => patient.patient_id !== patientToDelete))

          // Show success toast
          showToast("Patient deleted successfully", "The patient has been removed from the system.", "success")
        }
      } catch (error) {
        console.error('Error deleting patient:', error)
        showToast("Error deleting patient", error instanceof Error ? error.message : "An unknown error occurred", "error")
      } finally {
        setPatientToDelete(null)
        setIsDeleteDialogOpen(false)
      }
    }
  }

  // Edit patient
  const handleEditClick = (patient: any) => {
    setPatientToEdit({
      ...patient,
      dateofbirth: patient.dateofbirth ? new Date(patient.dateofbirth).toISOString().split('T')[0] : "",
      registration_date: patient.registration_date ? new Date(patient.registration_date).toISOString().split('T')[0] : ""
    })
    setIsEditDialogOpen(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPatientToEdit({
      ...patientToEdit,
      [name]: value,
    })
  }

  const handleEditSelectChange = (name: string, value: string) => {
    setPatientToEdit({
      ...patientToEdit,
      [name]: value,
    })
  }

  const handleSaveEdit = async () => {
    try {
      if (patientToEdit) {
        // Validate required fields
        if (!patientToEdit.full_name) {
          showToast("Full name is required", undefined, "error")
          return
        }

        // Prepare patient data for Supabase
        const patientData = {
          full_name: patientToEdit.full_name,
          dateofbirth: patientToEdit.dateofbirth || null,
          registration_date: patientToEdit.registration_date,
          phone_number: patientToEdit.phone_number,
          email: patientToEdit.email,
          blood_type: patientToEdit.blood_type,
          gender: patientToEdit.gender,
          address: patientToEdit.address,
          allergies: patientToEdit.allergies,
          chronic_diseases: patientToEdit.chronic_diseases,
          insurance_info: patientToEdit.insurance_info
        }

        // Update patient in database
        const updatedPatient = await patientsApi.updatePatient(patientToEdit.patient_id, patientData)

        if (updatedPatient) {
          // Refresh patients list
          const updatedPatients = await patientsApi.getAllPatients()
          setPatients(updatedPatients)

          // Show success toast
          showToast("Patient updated successfully", "The patient information has been updated.", "success")

          // Close dialog
          setPatientToEdit(null)
          setIsEditDialogOpen(false)
        }
      }
    } catch (error) {
      console.error('Error updating patient:', error)
      showToast("Error updating patient", error instanceof Error ? error.message : "An unknown error occurred", "error")
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <AdminPageWrapper title="Patients" activePage="patients">
      {/* Supabase Searchable Table */}
      <SupabaseSearchableTable
        type="patients"
        data={patients}
        title="Quản lý Bệnh nhân"
        description="Danh sách tất cả bệnh nhân trong hệ thống"
        isLoading={isLoading}
        onAdd={() => setIsNewPatientDialogOpen(true)}
        addButtonLabel="Thêm Bệnh nhân"
        onEdit={handleEditClick}
        onDelete={(patientId) => handleDeleteClick(patientId)}
        searchPlaceholder="Tìm kiếm bệnh nhân..."
        itemsPerPage={10}
      />

      {/* Add New Patient Dialog */}
      <Dialog open={isNewPatientDialogOpen} onOpenChange={setIsNewPatientDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Enter the details for the new patient.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Full Name
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={newPatient.full_name}
                onChange={handleNewPatientChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateofbirth" className="text-right">
                Date of Birth
              </Label>
              <Input
                id="dateofbirth"
                name="dateofbirth"
                type="date"
                value={newPatient.dateofbirth}
                onChange={handleNewPatientChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">
                Gender
              </Label>
              <Select
                value={newPatient.gender}
                onValueChange={(value) => handleNewPatientSelectChange("gender", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="text-right">
                Phone Number
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={newPatient.phone_number}
                onChange={handleNewPatientChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newPatient.email}
                onChange={handleNewPatientChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="blood_type" className="text-right">
                Blood Type
              </Label>
              <Select
                value={newPatient.blood_type}
                onValueChange={(value) => handleNewPatientSelectChange("blood_type", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Textarea
                id="address"
                name="address"
                value={newPatient.address}
                onChange={handleNewPatientChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="allergies" className="text-right">
                Allergies
              </Label>
              <Textarea
                id="allergies"
                name="allergies"
                value={newPatient.allergies}
                onChange={handleNewPatientChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chronic_diseases" className="text-right">
                Chronic Diseases
              </Label>
              <Textarea
                id="chronic_diseases"
                name="chronic_diseases"
                value={newPatient.chronic_diseases}
                onChange={handleNewPatientChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="insurance_info" className="text-right">
                Insurance Info
              </Label>
              <Input
                id="insurance_info"
                name="insurance_info"
                value={newPatient.insurance_info}
                onChange={handleNewPatientChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPatientDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewPatient}>Add Patient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>
              Update the patient details.
            </DialogDescription>
          </DialogHeader>
          {patientToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={patientToEdit.full_name}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dateofbirth" className="text-right">
                  Date of Birth
                </Label>
                <Input
                  id="dateofbirth"
                  name="dateofbirth"
                  type="date"
                  value={patientToEdit.dateofbirth}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">
                  Gender
                </Label>
                <Select
                  value={patientToEdit.gender}
                  onValueChange={(value) => handleEditSelectChange("gender", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone_number" className="text-right">
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={patientToEdit.phone_number}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={patientToEdit.email}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blood_type" className="text-right">
                  Blood Type
                </Label>
                <Select
                  value={patientToEdit.blood_type}
                  onValueChange={(value) => handleEditSelectChange("blood_type", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={patientToEdit.address}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="allergies" className="text-right">
                  Allergies
                </Label>
                <Textarea
                  id="allergies"
                  name="allergies"
                  value={patientToEdit.allergies}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="chronic_diseases" className="text-right">
                  Chronic Diseases
                </Label>
                <Textarea
                  id="chronic_diseases"
                  name="chronic_diseases"
                  value={patientToEdit.chronic_diseases}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="insurance_info" className="text-right">
                  Insurance Info
                </Label>
                <Input
                  id="insurance_info"
                  name="insurance_info"
                  value={patientToEdit.insurance_info}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Patient"
        description="Are you sure you want to delete this patient? This action cannot be undone."
        itemType="patient"
      />
    </AdminPageWrapper>
  )
}
