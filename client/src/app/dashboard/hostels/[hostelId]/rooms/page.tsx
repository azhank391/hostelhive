"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import { PermissionGate } from "@/components/PermissionGate";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Room, User } from "@/lib/types";
import { notification } from "@/lib/toast";
import { downloadExport } from "@/lib/download";
import { getApiUrl } from "@/lib/api-url";
import {
  BedIcon,
  PlusIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  UserIcon,
  HomeIcon,
  CheckCircleIcon,
  XIcon,
  DownloadIcon,
} from "lucide-react";

export default function HostelRoomsPage() {
  const params = useParams<{ hostelId: string }>();
  const hostelId = params?.hostelId || "";
  const { isLoading } = useAuth();
  const { hasPermission } = usePermissions();

  // Permission checks
  const canViewRooms = hasPermission("room_read");
  // const canCreateRooms = hasPermission('room_create');
  // const canUpdateRooms = hasPermission('room_update');
  // const canDeleteRooms = hasPermission('room_delete');
  // const canAllocateRooms = hasPermission('room_allocation_create');
  // const canDeallocateRooms = hasPermission('room_allocation_delete');
  const canExportRooms = hasPermission("export_room_data");

  // State management
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 0,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [createForm, setCreateForm] = useState({
    roomNumber: "",
    capacity: "1",
    block: "",
  });
  const [editForm, setEditForm] = useState({
    roomNumber: "",
    capacity: "1",
    block: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null);
  const [roomStudents, setRoomStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [deallocatingStudent, setDeallocatingStudent] = useState<string | null>(
    null
  );

  // Mobile accordion state - track which rooms are expanded
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Load all rooms once when component mounts
  const loadRooms = useCallback(async () => {
    if (!hostelId) return;

    try {
      setLoading(true);
      setError(null);

      // Direct API call - more reliable
      const response = await fetch(getApiUrl(`/api/hostels/${hostelId}/rooms`), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load rooms (${response.status})`);
      }

      const result = await response.json();
      console.log("🔍 DEBUG: Raw API response:", result);

      const roomsData = result.rooms || result.data || [];
      console.log("🔍 DEBUG: Rooms data before normalization:", roomsData);

      // Normalize the room data to match our frontend expectations
      const normalizedRooms = roomsData.map((room: Partial<Room>) => {
        console.log("🔍 DEBUG: Normalizing room:", room);
        const normalized: Room = {
          id:
            (room as any).id ||
            (room as any).roomId ||
            ((room as any)._id as string),
          roomNumber:
            (room as any).roomNumber ||
            (room as any).number ||
            (room as any).room_number,
          capacity: (room.capacity as number) ?? 1,
          block: room.block,
          occupied: (room.occupied as number) ?? 0,
          status: (room.status as Room["status"]) ?? "available",
          hostelId: (room as any).hostelId || (room as any).hostel_id,
        };
        console.log("🔍 DEBUG: Normalized room:", normalized);
        return normalized;
      });

      setRooms(normalizedRooms);
      setPagination({
        page: 1,
        limit: normalizedRooms.length || 0,
        total: normalizedRooms.length || 0,
        pages: 1,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load rooms";
      setError(errorMessage);
      notification.error("Failed to load rooms", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [hostelId]);

  useEffect(() => {
    if (hostelId) {
      loadRooms();
    }
  }, [hostelId, loadRooms]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Simple search handler - no debouncing needed
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Export rooms
  const handleExportRooms = useCallback(
    async (format: "csv" | "json" = "csv") => {
      if (!hostelId) return;
      try {
        await downloadExport({
          url: `/api/hostels/${hostelId}/rooms/export`,
          format,
          filename: `rooms-${hostelId}`,
        });
        notification.success(`Rooms exported as ${format.toUpperCase()}`);
      } catch (e) {
        console.error(e);
        notification.error("Failed to export rooms");
      }
    },
    [hostelId]
  );

  // Render header actions (export) - we add an export button near filters/search

  // CRUD Operations
  const handleCreateRoom = async () => {
    if (!hostelId) {
      notification.error("No hostel selected", {
        description: "Please refresh the page and try again.",
      });
      return;
    }

    if (!createForm.roomNumber.trim()) {
      notification.error("Room number is required", {
        description: "Please enter a valid room number.",
      });
      return;
    }

    try {
      setIsCreating(true);

      // Direct API call - more reliable
      const response = await fetch(getApiUrl(`/api/hostels/${hostelId}/rooms`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          ...createForm,
          capacity: parseInt(createForm.capacity) || 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to create room (${response.status})`
        );
      }

      const newRoom = await response.json();

      setShowCreateModal(false);
      setCreateForm({ roomNumber: "", capacity: "1", block: "" });

      notification.success("Room created successfully!", {
        description: `Room ${newRoom.roomNumber} has been added to the hostel.`,
      });

      // Auto-refresh to fetch latest data
      await loadRooms();
    } catch (error) {
      console.error("Failed to create room:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create room";
      notification.error("Failed to create room", {
        description: errorMessage,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRoom = async (updates: Partial<Room>) => {
    console.log("🔍 DEBUG: handleUpdateRoom called with updates:", updates);
    console.log("🔍 DEBUG: editingRoom:", editingRoom);
    console.log(
      "🔍 DEBUG: editingRoom.id:",
      editingRoom?.id,
      "Type:",
      typeof editingRoom?.id
    );

    if (!editingRoom) {
      console.error("❌ DEBUG: No editing room set");
      return;
    }

    if (!editingRoom.id) {
      console.error("❌ DEBUG: Editing room has no ID:", editingRoom);
      notification.error("Invalid room data", {
        description: "Room ID is missing. Please refresh and try again.",
      });
      return;
    }

    if (!hostelId) {
      notification.error("No hostel selected", {
        description: "Please refresh the page and try again.",
      });
      return;
    }

    if (!updates.roomNumber?.trim()) {
      notification.error("Room number is required", {
        description: "Please enter a valid room number.",
      });
      return;
    }

    try {
      setIsUpdating(true);

      // Direct API call - more reliable
      const apiUrl = getApiUrl(`/api/hostels/${hostelId}/rooms/${editingRoom.id}`);
      console.log("🔍 DEBUG: Making API call to:", apiUrl);
      console.log("🔍 DEBUG: Request body:", updates);

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to update room (${response.status})`
        );
      }

      const updatedRoom = await response.json();

      setShowEditModal(false);
      setEditingRoom(null);

      notification.success("Room updated successfully!", {
        description: `Room ${updatedRoom.roomNumber} has been updated.`,
      });

      // Auto-refresh to fetch latest data
      await loadRooms();
    } catch (error) {
      console.error("Failed to update room:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update room";
      notification.error("Failed to update room", {
        description: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!hostelId) {
      notification.error("No hostel selected", {
        description: "Please refresh the page and try again.",
      });
      return;
    }

    // Find the room to get its details for the confirmation
    const roomToDelete = rooms.find((r) => r.id === roomId);
    if (!roomToDelete) {
      notification.error("Room not found", {
        description: "The room you are trying to delete could not be found.",
      });
      return;
    }

    // Use a more user-friendly confirmation
    if (
      !confirm(
        `Are you sure you want to delete Room ${roomToDelete.roomNumber}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(roomId);

      // Direct API call - more reliable
      const response = await fetch(getApiUrl(`/api/hostels/${hostelId}/rooms/${roomId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to delete room (${response.status})`
        );
      }

      notification.success("Room deleted successfully!", {
        description: `Room ${roomToDelete.roomNumber} has been removed from the hostel.`,
      });

      // Auto-refresh to fetch latest data
      await loadRooms();
    } catch (error) {
      console.error("Failed to delete room:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete room";
      notification.error("Failed to delete room", {
        description: errorMessage,
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditModal = (room: Room) => {
    console.log("🔍 DEBUG: openEditModal called with room:", room);
    console.log("🔍 DEBUG: Room ID type and value:", typeof room.id, room.id);

    if (!room.id) {
      console.error("❌ DEBUG: Room ID is missing:", room);
      notification.error("Invalid room data", {
        description: "Room ID is missing. Cannot edit this room.",
      });
      return;
    }

    console.log("✅ DEBUG: Setting editing room with ID:", room.id);
    setEditingRoom(room);
    setEditForm({
      roomNumber: room.roomNumber || "",
      capacity: room.capacity?.toString() || "1",
      block: room.block || "",
    });
    setShowEditModal(true);
  };

  const openViewModal = async (room: Room) => {
    setViewingRoom(room);
    setShowViewModal(true);
    setLoadingStudents(true);

    try {
      // Fetch students from the new API endpoint
      const response = await fetch(
        getApiUrl(`/api/hostels/${hostelId}/rooms/${room.id}/students`),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch room students (${response.status})`
        );
      }

      const data = await response.json();
      setRoomStudents(data.students || []);
    } catch (error) {
      console.error("Failed to fetch room students:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch room students";
      notification.error("Failed to fetch room students", {
        description: errorMessage,
      });
      setRoomStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleDeallocateStudent = async (
    studentId: string,
    studentName: string
  ) => {
    if (!viewingRoom) return;

    // Confirmation dialog
    if (
      !confirm(
        `Are you sure you want to remove ${studentName} from Room ${viewingRoom.roomNumber}?`
      )
    ) {
      return;
    }

    try {
      setDeallocatingStudent(studentId);

      // Call the deallocation API endpoint
      const response = await fetch(
        getApiUrl(`/api/hostels/${hostelId}/room-allocations/${studentId}`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to remove student (${response.status})`
        );
      }

      // ✅ OPTIMAL SOLUTION: Update all related state immediately for instant UI reflection

      // 1. Remove student from room students list (modal view)
      setRoomStudents((prev) =>
        prev.filter((student) => student.id !== studentId)
      );

      // 2. Update the viewing room's occupied count locally
      setViewingRoom((prev) =>
        prev
          ? { ...prev, occupied: Math.max(0, (prev.occupied || 0) - 1) }
          : null
      );

      // 3. Update the main rooms list to reflect new occupancy
      setRooms((prev) =>
        prev.map((room) =>
          room.id === viewingRoom.id
            ? { ...room, occupied: Math.max(0, (room.occupied || 0) - 1) }
            : room
        )
      );

      notification.success("Student removed successfully!", {
        description: `${studentName} has been removed from Room ${viewingRoom.roomNumber}.`,
      });
    } catch (error) {
      console.error("Failed to remove student:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove student";
      notification.error("Failed to remove student", {
        description: errorMessage,
      });

      // If error occurred, refresh data to ensure consistency
      await loadRooms();
      if (viewingRoom) {
        await openViewModal(viewingRoom);
      }
    } finally {
      setDeallocatingStudent(null);
    }
  };

  // All computed values must be calculated before any early returns
  const availableCount = useMemo(
    () => rooms.filter((r) => (r.occupied || 0) < (r.capacity || 1)).length,
    [rooms]
  );
  // Removed unused occupiedCount computation
  const totalCapacity = useMemo(
    () => rooms.reduce((sum, r) => sum + (r.capacity || 0), 0),
    [rooms]
  );
  const totalOccupied = useMemo(
    () => rooms.reduce((sum, r) => sum + (r.occupied || 0), 0),
    [rooms]
  );

  // Filter rooms based on search query - simple and efficient
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;

    const query = searchQuery.toLowerCase().trim();
    return rooms.filter(
      (room) =>
        room.roomNumber?.toLowerCase().includes(query) ||
        room.block?.toLowerCase().includes(query) ||
        room.capacity?.toString().includes(query)
      // Note: To search by student names, we'd need to fetch student data for each room
      // This would require a more complex API call or storing student names in room data
    );
  }, [rooms, searchQuery]);

  // Early returns after all hooks
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            Loading rooms for hostel: {hostelId}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Failed to Load Rooms
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  if (!hostelId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Hostel Not Selected
          </h1>
          <p className="text-gray-600 mb-4">
            Please select a hostel or refresh the page to continue.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  // Check if user has permission to view rooms
  if (!canViewRooms) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <BedIcon size={64} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to view room management.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator to get access to room management
            features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
          <p className="mt-2 text-gray-600">
            Manage and monitor all rooms in your hostel
          </p>
        </div>

        {/* Show Add New Room button only if user has room_create permission */}
        <PermissionGate permission="room_create">
          <Button
            variant="primary"
            className="flex items-center px-6 py-3"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon size={18} className="mr-2" />
            Add New Room
          </Button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <PermissionGate permission="room_read">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500 text-white">
                <HomeIcon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-700">Total Rooms</p>
                <p className="text-2xl font-bold text-blue-900">
                  {pagination?.total || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500 text-white">
                <CheckCircleIcon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-700">Available</p>
                <p className="text-2xl font-bold text-green-900">
                  {availableCount}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-500 text-white">
                <UserIcon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-700">
                  Total Capacity
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {totalCapacity}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-500 text-white">
                <UserIcon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-700">Occupied</p>
                <p className="text-2xl font-bold text-orange-900">
                  {totalOccupied}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </PermissionGate>

      {/* Filters and Search */}
      <Card className="p-6 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <SearchIcon
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by room number, block, or capacity..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            {/* Clear search button */}
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear search"
              >
                <XIcon
                  size={16}
                  className="text-gray-400 hover:text-gray-600"
                />
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {searchQuery
              ? `${filteredRooms.length} room${
                  filteredRooms.length !== 1 ? "s" : ""
                } found for \u201C${searchQuery}\u201D`
              : `${rooms.length} room${rooms.length !== 1 ? "s" : ""} found`}
          </div>
        </div>
      </Card>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <BedIcon size={64} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No rooms match your search" : "No rooms found"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? `No rooms found for \u201C${searchQuery}\u201D`
              : "Get started by adding your first room"}
          </p>
          {!searchQuery && (
            <PermissionGate permission="room_create">
              <Button variant="primary" className="flex items-center mx-auto">
                <PlusIcon size={16} className="mr-2" />
                Add New Room
              </Button>
            </PermissionGate>
          )}
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="overflow-hidden hidden md:block">
            {canExportRooms && (
              <div className="flex justify-end px-6 pt-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExportRooms("csv")}
                    className="flex items-center"
                  >
                    <DownloadIcon size={16} className="mr-2" /> Export CSV
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => handleExportRooms("json")}
                    className="flex items-center"
                  >
                    <DownloadIcon size={16} className="mr-2" /> JSON
                  </Button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Block
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Occupancy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Space
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRooms.map((room) => {
                    const occupiedBeds = room.occupied || 0;
                    const capacity = room.capacity || 0;
                    const occupancyPercentage =
                      capacity > 0 ? (occupiedBeds / capacity) * 100 : 0;
                    const availableSpots = capacity - occupiedBeds;

                    return (
                      <tr key={room.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <BedIcon size={20} className="text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Room {room.roomNumber}
                              </div>
                              {/* Internal ID intentionally hidden to reduce clutter */}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {room.block
                              ? `Block ${room.block}`
                              : "No block assigned"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {capacity} beds
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {occupiedBeds}/{capacity}
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                occupancyPercentage === 100
                                  ? "bg-red-500"
                                  : occupancyPercentage >= 80
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${occupancyPercentage}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                              occupancyPercentage === 100
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-green-100 text-green-800 border border-green-200"
                            }`}
                          >
                            {occupancyPercentage === 100 ? "Full" : "Available"}
                          </span>
                          {occupiedBeds > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {occupiedBeds} student
                              {occupiedBeds !== 1 ? "s" : ""} assigned
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {availableSpots} spots
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block text-left">
                            <select
                              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onChange={(e) => {
                                const action = e.target.value;
                                if (action === "view") {
                                  openViewModal(room);
                                } else if (action === "edit") {
                                  openEditModal(room);
                                } else if (action === "delete") {
                                  handleDeleteRoom(room.id);
                                }
                                e.target.value = ""; // Reset select
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Actions
                              </option>
                              {hasPermission("room_read") && (
                                <option value="view">View Details</option>
                              )}
                              {hasPermission("room_update") && (
                                <option value="edit">Edit Room</option>
                              )}
                              {hasPermission("room_delete") && (
                                <option value="delete" className="text-red-600">
                                  Delete Room
                                </option>
                              )}
                            </select>
                            {isDeleting === room.id && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <LoadingSpinner
                                  size="sm"
                                  className="text-red-600"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Accordion View */}
          <div className="md:hidden space-y-4">
            {filteredRooms.map((room) => {
              const occupiedBeds = room.occupied || 0;
              const capacity = room.capacity || 0;
              const occupancyPercentage =
                capacity > 0 ? (occupiedBeds / capacity) * 100 : 0;
              const availableSpots = capacity - occupiedBeds;
              const isExpanded = expandedRooms.has(room.id);

              const toggleExpanded = () => {
                const newExpanded = new Set(expandedRooms);
                if (isExpanded) {
                  newExpanded.delete(room.id);
                } else {
                  newExpanded.add(room.id);
                }
                setExpandedRooms(newExpanded);
              };

              return (
                <Card key={room.id} className="overflow-hidden">
                  {/* Collapsible Header */}
                  <button
                    className="w-full px-4 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors"
                    onClick={toggleExpanded}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <BedIcon size={20} className="text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-base font-medium text-gray-900">
                            Room {room.roomNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {room.block
                              ? `Block ${room.block}`
                              : "No block assigned"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            occupancyPercentage === 100
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {occupancyPercentage === 100 ? "Full" : "Available"}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            isExpanded ? "transform rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="space-y-4 pt-4">
                        {/* Room Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                              Capacity
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {capacity} beds
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                              Occupied
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {occupiedBeds}/{capacity}
                            </p>
                          </div>
                        </div>

                        {/* Occupancy Progress */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                              Occupancy Rate
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              {Math.round(occupancyPercentage)}%
                            </p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${
                                occupancyPercentage === 100
                                  ? "bg-red-500"
                                  : occupancyPercentage >= 80
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${occupancyPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Available Space */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="text-xs text-green-600 uppercase tracking-wide font-medium mb-1">
                            Available Space
                          </p>
                          <p className="text-lg font-semibold text-green-700">
                            {availableSpots} spots available
                          </p>
                        </div>

                        {/* Student Information */}
                        {occupiedBeds > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-600 uppercase tracking-wide font-medium mb-1">
                              Students
                            </p>
                            <p className="text-sm text-blue-800">
                              {occupiedBeds} student
                              {occupiedBeds !== 1 ? "s" : ""} currently assigned
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Tap &quot;View Details&quot; to see student list
                            </p>
                          </div>
                        )}

                        {/* Room ID */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            Room ID
                          </p>
                          <p className="text-sm font-mono text-gray-700">
                            {room.id}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2 pt-2">
                          {hasPermission("room_read") && (
                            <Button
                              variant="outline"
                              className="w-full justify-center hover:bg-blue-50 hover:border-blue-300"
                              onClick={() => openViewModal(room)}
                            >
                              <EyeIcon size={16} className="mr-2" />
                              View Details
                            </Button>
                          )}

                          {hasPermission("room_update") && (
                            <Button
                              variant="outline"
                              className="w-full justify-center hover:bg-green-50 hover:border-green-300"
                              onClick={() => openEditModal(room)}
                            >
                              <EditIcon size={16} className="mr-2" />
                              Edit Room
                            </Button>
                          )}

                          {hasPermission("room_delete") && (
                            <Button
                              variant="outline"
                              className="w-full justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                              onClick={() => handleDeleteRoom(room.id)}
                              disabled={isDeleting === room.id}
                            >
                              {isDeleting === room.id ? (
                                <>
                                  <LoadingSpinner
                                    size="sm"
                                    className="mr-2 text-red-600"
                                  />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <span className="text-red-600 mr-2">×</span>
                                  Delete Room
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* No pagination needed - all rooms loaded at once */}

      {/* Create Room Modal */}
      <PermissionGate permission="room_create">
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            style={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              position: "fixed",
            }}
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={createForm.roomNumber}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        roomNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="text"
                    value={createForm.capacity}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, capacity: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 2, 4, 6, or any value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block (Optional)
                  </label>
                  <input
                    type="text"
                    value={createForm.block}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, block: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., A, B, C"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateRoom}
                  className="flex-1"
                  disabled={!createForm.roomNumber || isCreating}
                >
                  {isCreating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Room"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </PermissionGate>

      {/* Edit Room Modal */}
      <PermissionGate permission="room_update">
        {showEditModal && editingRoom && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            style={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-4">
                Edit Room {editingRoom.roomNumber}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={editForm.roomNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, roomNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="text"
                    value={editForm.capacity}
                    onChange={(e) =>
                      setEditForm({ ...editForm, capacity: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 2, 4, 6, or any value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.block}
                    onChange={(e) =>
                      setEditForm({ ...editForm, block: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., A, B, C"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    handleUpdateRoom({
                      ...editForm,
                      capacity: parseInt(editForm.capacity) || 1,
                    })
                  }
                  className="flex-1"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Room"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </PermissionGate>

      {/* View Room Details Modal */}
      <PermissionGate permission="room_read">
        {showViewModal && viewingRoom && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            style={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Room {viewingRoom.roomNumber} Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Capacity
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {viewingRoom.capacity || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Occupied
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {viewingRoom.occupied || 0}/{viewingRoom.capacity || 0}
                    </p>
                  </div>
                </div>

                {viewingRoom.block && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Block
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {viewingRoom.block}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Students in Room
                  </h4>
                  {roomStudents.length > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {roomStudents.length} student
                      {roomStudents.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {loadingStudents ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-gray-500">
                      Loading students...
                    </span>
                  </div>
                ) : roomStudents.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {roomStudents.map((student) => (
                      <Card
                        key={student.id}
                        className="p-3 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <UserIcon size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {student.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {student.email}
                            </p>
                            <p className="text-xs text-gray-400">Student</p>
                          </div>
                          {/* Only show Remove button if user has room_allocation_delete permission */}
                          {hasPermission("room_allocation_delete") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 px-3 py-1"
                              onClick={() =>
                                handleDeallocateStudent(
                                  student.id,
                                  student.name
                                )
                              }
                              disabled={deallocatingStudent === student.id}
                            >
                              {deallocatingStudent === student.id ? (
                                <LoadingSpinner
                                  size="sm"
                                  className="text-white"
                                />
                              ) : (
                                "Remove"
                              )}
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                      <UserIcon size={48} />
                    </div>
                    <p className="text-gray-500 font-medium">
                      No students assigned
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      This room is currently empty
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </PermissionGate>
    </div>
  );
}
