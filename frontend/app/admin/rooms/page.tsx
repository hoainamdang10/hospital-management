"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { roomsApi, departmentsApi } from "@/lib/supabase"

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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/toast-provider"

export default function RoomsPage() {
  // State variables
  const [isNewRoomDialogOpen, setIsNewRoomDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [roomToEdit, setRoomToEdit] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])

  // Room type options for dropdown
  const roomTypes = [
    "All Types", // This will be sliced out when used
    "Ward",
    "ICU",
    "Emergency",
    "Surgery",
    "Consultation",
    "Laboratory",
    "Radiology",
    "Pharmacy",
    "Recovery",
    "Isolation",
    "Other"
  ]

  // Room status options for dropdown
  const roomStatuses = [
    "All Statuses", // This will be sliced out when used
    "Available",
    "Occupied",
    "Maintenance",
    "Reserved",
    "Cleaning",
    "Out of Service"
  ]

  // Toast notifications
  const { showToast } = useToast()
  const [newRoom, setNewRoom] = useState({
    room_number: "",
    department_id: "",
    room_type: "Ward",
    capacity: 0,
    status: "Available"
  })



  // Fetch rooms and departments data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get rooms data
        const roomsData = await roomsApi.getAllRooms();
        setRooms(roomsData);

        // Get departments data
        const departmentsData = await departmentsApi.getAllDepartments();
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setRooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);



  // Handle new room form
  const handleNewRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRoom({
      ...newRoom,
      [name]: name === 'capacity' ? parseInt(value) : value,
    });
  };

  const handleNewRoomSelectChange = (name: string, value: string) => {
    setNewRoom({
      ...newRoom,
      [name]: value,
    });
  };

  // Add new room
  const handleAddNewRoom = async () => {
    try {
      // Validate required fields
      if (!newRoom.room_number) {
        showToast("Room number is required", undefined, "error");
        return;
      }

      if (!newRoom.department_id) {
        showToast("Department is required", undefined, "error");
        return;
      }

      // Prepare room data for Supabase
      const roomData = {
        room_number: newRoom.room_number,
        room_type: newRoom.room_type,
        department_id: newRoom.department_id,
        capacity: newRoom.capacity,
        status: newRoom.status
      };

      // Add room to database
      const newRoomData = await roomsApi.addRoom(roomData);

      if (newRoomData) {
        // Update state with new room
        setRooms([...rooms, newRoomData]);

        // Show success toast
        showToast("Room added successfully", "The room has been added to the system.", "success");

        // Reset form and close dialog
        setNewRoom({
          room_number: "",
          department_id: "",
          room_type: "Ward",
          capacity: 0,
          status: "Available"
        });
        setIsNewRoomDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding room:', error);
      showToast("Error adding room", error instanceof Error ? error.message : "An unknown error occurred", "error");
    }
  };

  // Delete room
  const handleDeleteClick = (roomId: string) => {
    setRoomToDelete(roomId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (roomToDelete) {
      try {
        // Delete from database
        const success = await roomsApi.deleteRoom(roomToDelete);

        if (success) {
          // Update UI
          setRooms(rooms.filter((room) => room.room_id !== roomToDelete));

          // Show success toast
          showToast("Room deleted successfully", "The room has been removed from the system.", "success");
        }
      } catch (error) {
        console.error('Error deleting room:', error);
        showToast("Error deleting room", error instanceof Error ? error.message : "An unknown error occurred", "error");
      } finally {
        setRoomToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  // Edit room
  const handleEditClick = (room: any) => {
    setRoomToEdit({
      id: room.room_id,
      number: room.room_number,
      type: room.room_type,
      department_id: room.department_id,
      capacity: room.capacity,
      status: room.status
    });
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoomToEdit({
      ...roomToEdit,
      [name]: name === 'capacity' ? parseInt(value) : value,
    });
  };

  const handleEditSelectChange = (name: string, value: string) => {
    setRoomToEdit({
      ...roomToEdit,
      [name]: value,
    });
  };

  const handleSaveEdit = async () => {
    try {
      if (roomToEdit) {
        // Validate required fields
        if (!roomToEdit.number) {
          showToast("Room number is required", undefined, "error");
          return;
        }

        if (!roomToEdit.department_id) {
          showToast("Department is required", undefined, "error");
          return;
        }

        // Prepare room data for Supabase
        const roomData = {
          room_number: roomToEdit.number,
          room_type: roomToEdit.type,
          department_id: roomToEdit.department_id,
          capacity: roomToEdit.capacity,
          status: roomToEdit.status
        };

        // Update room in database
        const updatedRoom = await roomsApi.updateRoom(roomToEdit.id, roomData);

        if (updatedRoom) {
          // Update rooms state
          setRooms(
            rooms.map((room) =>
              room.room_id === roomToEdit.id
                ? updatedRoom
                : room
            )
          );

          // Show success toast
          showToast("Room updated successfully", "The room information has been updated.", "success");

          // Close dialog
          setRoomToEdit(null);
          setIsEditDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error updating room:', error);
      showToast("Error updating room", error instanceof Error ? error.message : "An unknown error occurred", "error");
    }
  };

  return (
    <AdminPageWrapper title="Rooms" activePage="rooms">
      {/* Supabase Searchable Table */}
      <SupabaseSearchableTable
        type="rooms"
        data={rooms}
        departments={departments}
        title="Quản lý Phòng"
        description="Danh sách tất cả phòng trong hệ thống"
        isLoading={isLoading}
        onAdd={() => setIsNewRoomDialogOpen(true)}
        addButtonLabel="Thêm Phòng"
        onEdit={handleEditClick}
        onDelete={(roomId) => handleDeleteClick(roomId)}
        searchPlaceholder="Tìm kiếm phòng..."
        itemsPerPage={10}
      />

      {/* Add New Room Dialog */}
      <Dialog open={isNewRoomDialogOpen} onOpenChange={setIsNewRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Enter the details for the new room.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_number" className="text-right">
                Room Number
              </Label>
              <Input
                id="room_number"
                name="room_number"
                value={newRoom.room_number}
                onChange={handleNewRoomChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room_type" className="text-right">
                Room Type
              </Label>
              <Select
                value={newRoom.room_type}
                onValueChange={(value) => handleNewRoomSelectChange("room_type", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.slice(1).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department_id" className="text-right">
                Department
              </Label>
              <Select
                value={newRoom.department_id}
                onValueChange={(value) => handleNewRoomSelectChange("department_id", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={newRoom.capacity}
                onChange={handleNewRoomChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={newRoom.status}
                onValueChange={(value) => handleNewRoomSelectChange("status", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {roomStatuses.slice(1).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRoomDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewRoom}>Add Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update the room details.
            </DialogDescription>
          </DialogHeader>
          {roomToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="number" className="text-right">
                  Room Number
                </Label>
                <Input
                  id="number"
                  name="number"
                  value={roomToEdit.number}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Room Type
                </Label>
                <Select
                  value={roomToEdit.type}
                  onValueChange={(value) => handleEditSelectChange("type", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.slice(1).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department_id" className="text-right">
                  Department
                </Label>
                <Select
                  value={roomToEdit.department_id}
                  onValueChange={(value) => handleEditSelectChange("department_id", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={roomToEdit.capacity}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={roomToEdit.status}
                  onValueChange={(value) => handleEditSelectChange("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomStatuses.slice(1).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        title="Delete Room"
        description="Are you sure you want to delete this room? This action cannot be undone."
      />
    </AdminPageWrapper>
  )
}
