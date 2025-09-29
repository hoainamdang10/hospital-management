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
import { departmentsApi } from "@/lib/supabase"

// Shared components
import { AdminPageWrapper } from "../page-wrapper"
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator"
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog"

// UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/toast-provider"

export default function DepartmentsPage() {
  // State variables
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isNewDepartmentDialogOpen, setIsNewDepartmentDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [departmentToEdit, setDepartmentToEdit] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [departments, setDepartments] = useState<any[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Toast notifications
  const { showToast } = useToast()

  // New department state
  const [newDepartment, setNewDepartment] = useState({
    department_name: "",
  })

  // Constants
  const departmentsPerPage = 10

  // Fetch departments data from Supabase
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true)
      try {
        const data = await departmentsApi.getAllDepartments()
        setDepartments(data)
      } catch (error) {
        console.error('Error fetching departments:', error)
        setDepartments([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDepartments()
  }, [])

  // Filter departments based on search term
  const filteredDepartments = departments.filter((department) =>
    (department.name && department.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (department.department_id && department.department_id.toString().includes(searchTerm)) ||
    (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (department.location && department.location.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalPages = Math.ceil(filteredDepartments.length / departmentsPerPage)

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

  // Handle new department form
  const handleNewDepartmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewDepartment({
      ...newDepartment,
      [name]: value,
    })
  }

  // Add new department
  const handleAddNewDepartment = async () => {
    try {
      // Validate required fields
      if (!newDepartment.department_name) {
        showToast("Department name is required", undefined, "error")
        return
      }

      // Prepare department data for Supabase
      const departmentData = {
        department_name: newDepartment.department_name,
      }

      // Add department to database
      const newDepartmentData = await departmentsApi.addDepartment(departmentData)

      if (newDepartmentData) {
        // Refresh departments list
        const updatedDepartments = await departmentsApi.getAllDepartments()
        setDepartments(updatedDepartments)

        // Show success toast
        showToast("Department added successfully", "The department has been added to the system.", "success")

        // Reset form and close dialog
        setNewDepartment({
          department_name: "",
        })
        setIsNewDepartmentDialogOpen(false)
      }
    } catch (error) {
      console.error('Error adding department:', error)
      showToast("Error adding department", error instanceof Error ? error.message : "An unknown error occurred", "error")
    }
  }

  // Delete department
  const handleDeleteClick = (departmentId: string) => {
    setDepartmentToDelete(departmentId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (departmentToDelete) {
      try {
        // Delete from database
        const success = await departmentsApi.deleteDepartment(departmentToDelete)

        if (success) {
          // Update UI
          setDepartments(departments.filter((department) => department.department_id !== departmentToDelete))

          // Show success toast
          showToast("Department deleted successfully", "The department has been removed from the system.", "success")
        }
      } catch (error) {
        console.error('Error deleting department:', error)
        showToast("Error deleting department", error instanceof Error ? error.message : "An unknown error occurred", "error")
      } finally {
        setDepartmentToDelete(null)
        setIsDeleteDialogOpen(false)
      }
    }
  }

  // Edit department
  const handleEditClick = (department: any) => {
    setDepartmentToEdit({
      ...department,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDepartmentToEdit({
      ...departmentToEdit,
      [name]: value,
    })
  }

  const handleSaveEdit = async () => {
    try {
      if (departmentToEdit) {
        // Validate required fields
        if (!departmentToEdit.department_name) {
          showToast("Department name is required", undefined, "error")
          return
        }

        // Prepare department data for Supabase
        const departmentData = {
          department_name: departmentToEdit.department_name,
        }

        // Update department in database
        const updatedDepartment = await departmentsApi.updateDepartment(
          departmentToEdit.department_id,
          departmentData
        )

        if (updatedDepartment) {
          // Refresh departments list
          const updatedDepartments = await departmentsApi.getAllDepartments()
          setDepartments(updatedDepartments)

          // Show success toast
          showToast("Department updated successfully", "The department information has been updated.", "success")

          // Close dialog
          setDepartmentToEdit(null)
          setIsEditDialogOpen(false)
        }
      }
    } catch (error) {
      console.error('Error updating department:', error)
      showToast("Error updating department", error instanceof Error ? error.message : "An unknown error occurred", "error")
    }
  }

  return (
    <AdminPageWrapper title="Departments" activePage="departments">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search departments..."
              className="pl-8 w-full md:w-[300px]"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <Button onClick={() => setIsNewDepartmentDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </div>

      {/* Departments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingIndicator size="medium" text="Loading departments..." fullWidth={true} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Department ID</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No departments found
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments
                      .slice((currentPage - 1) * departmentsPerPage, currentPage * departmentsPerPage)
                      .map((department) => (
                        <tr key={department.department_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{department.department_id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{department.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-xs truncate">{department.description || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{department.location || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {department.phone_number && <div>{department.phone_number}</div>}
                              {department.email && <div className="text-blue-600">{department.email}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              department.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {department.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(department)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(department.department_id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredDepartments.length > 0 ? (currentPage - 1) * departmentsPerPage + 1 : 0}</span> to{" "}
          <span className="font-medium">{Math.min(currentPage * departmentsPerPage, filteredDepartments.length)}</span> of{" "}
          <span className="font-medium">{filteredDepartments.length}</span> departments
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>
            Next
          </Button>
        </div>
      </div>

      {/* Add New Department Dialog */}
      <Dialog open={isNewDepartmentDialogOpen} onOpenChange={setIsNewDepartmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Enter the details for the new department.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department_name" className="text-right">
                Department Name
              </Label>
              <Input
                id="department_name"
                name="department_name"
                value={newDepartment.department_name}
                onChange={handleNewDepartmentChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDepartmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewDepartment}>Add Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the department details.
            </DialogDescription>
          </DialogHeader>
          {departmentToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department_name" className="text-right">
                  Department Name
                </Label>
                <Input
                  id="department_name"
                  name="department_name"
                  value={departmentToEdit.department_name}
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
        title="Delete Department"
        description="Are you sure you want to delete this department? This action cannot be undone."
        itemType="department"
      />
    </AdminPageWrapper>
  )
}
