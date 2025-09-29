"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useCurrentHostelId } from "@/lib/context-aware-api";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Complaint } from "@/lib/types";
import { notification } from "@/lib/toast";
import {
  AlertCircleIcon,
  PlusIcon,
  SearchIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DownloadIcon,
} from "lucide-react";

export default function HostelComplaintsPage() {
  // 🚨 INFINITE LOOP FIXED:
  // - Removed getHostelId from dependencies (was recreating every render)
  // - Consolidated multiple useEffect hooks into stable ones
  // - Added loading guard to prevent simultaneous API calls
  // - Added debug counter to track effect runs
  //
  // 🎯 ROLE-BASED FUNCTIONALITY:
  // - Students: Can view their own complaints and submit new ones
  // - Owners: Can view all complaints and update status/priority
  const params = useParams<{ hostelId: string }>();
  const hostelId = params?.hostelId || "";

  // Context-aware API hooks
  const { hasHostel } = useCurrentHostelId();

  // Get user role from auth context
  const { user, isLoading } = useAuth();
  const { hasPermission } = usePermissions();

  // Permission checks
  const canViewComplaints = hasPermission("complaint_read");
  const canCreateComplaints = hasPermission("complaint_create");
  // Canonical permission checks
  const canUpdateComplaints = hasPermission("complaint_update");
  const canDeleteComplaints = hasPermission("complaint_delete");
  // const canViewComplaintStats = hasPermission('view_complaint_stats');
  const canExportComplaints = hasPermission("export_complaint_data");

  // Debug counter to track effect runs and prevent infinite loops
  const effectRunCount = useRef(0);

  // State management
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Debug initial values
  console.log("🔍 Initial values:", { hasHostel, hostelId, loading });

  // Load all complaints function - FIXED: Simplified and direct
  const loadAllComplaints = useCallback(async () => {
    try {
      console.log("📡 Setting loading to true");
      setLoading(true);
      setError(null);
      // Fetch all complaints without pagination for local filtering
      const response = await fetch(
        `/api/hostels/${hostelId}/complaints?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch complaints: ${response.status}`);
      }

      const result = await response.json();
      console.log("📡 API response:", result);

      // Store all complaints
      if (result.data) {
        setAllComplaints(result.data);
      } else {
        setAllComplaints(Array.isArray(result) ? result : []);
      }
    } catch (err) {
      console.error("Complaints load error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load complaints";
      setError(errorMessage);
    } finally {
      console.log("📡 Setting loading to false");
      setLoading(false);
    }
  }, [hostelId]); // ✅ Only depend on hostelId - the most stable value

  // Apply local filters and pagination - FIXED: Simplified dependencies
  const applyLocalFilters = useCallback(() => {
    let filtered = [...allComplaints];

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(
        (complaint) => complaint.status === statusFilter
      );
    }

    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(
        (complaint) => complaint.priority === priorityFilter
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (complaint) =>
          complaint.title.toLowerCase().includes(query) ||
          complaint.description.toLowerCase().includes(query) ||
          complaint.user?.name?.toLowerCase().includes(query) ||
          complaint.user?.email?.toLowerCase().includes(query)
      );
    }

    // Calculate pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / 10);
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;

    // Apply pagination
    const paginatedComplaints = filtered.slice(startIndex, endIndex);

    setComplaints(paginatedComplaints);
    setPagination({
      page,
      limit: 10,
      total,
      pages: totalPages,
    });
  }, [allComplaints, statusFilter, priorityFilter, searchQuery, page]); // ✅ Dependencies are stable

  // Single useEffect to handle data loading - FIXED: Simplified and direct
  useEffect(() => {
    effectRunCount.current += 1;
    console.log(`🔄 useEffect triggered (run #${effectRunCount.current}):`, {
      hasHostel,
      hostelId,
      allComplaintsLength: allComplaints.length,
      loading,
    });

    // Load complaints when we have a hostelId (either from context or URL)
    if (hostelId) {
      console.log("🚀 Loading complaints for hostel:", hostelId);
      loadAllComplaints();
    } else {
      console.log("❌ Cannot load complaints: no hostelId");
    }
  }, [hostelId]); // ✅ Only depend on hostelId - the most stable value

  // Removed fallback timer - was causing periodic requests

  // Separate effect for filtering - only runs when data or filters change
  useEffect(() => {
    if (allComplaints.length > 0) {
      console.log("🔍 Applying filters to", allComplaints.length, "complaints");
      applyLocalFilters();
    }
  }, [allComplaints, statusFilter, priorityFilter, searchQuery, page]); // ✅ Direct dependencies, no function calls

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status === statusFilter ? "" : status);
    setPage(1);
  };

  const handlePriorityFilterChange = (priority: string) => {
    setPriorityFilter(priority === priorityFilter ? "" : priority);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleStatusUpdate = async (
    complaintId: string,
    newStatus: "pending" | "in_progress" | "resolved" | "rejected",
    newPriority?: "low" | "medium" | "high" | "urgent"
  ) => {
    try {
      const response = await fetch(
        `/api/hostels/${hostelId}/complaints/${complaintId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            status: newStatus,
            ...(newPriority && { priority: newPriority }),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update complaint status");
      }

      // Update the complaint in local state
      setAllComplaints((prev) =>
        prev.map((complaint) =>
          complaint.id === complaintId
            ? {
                ...complaint,
                status: newStatus,
                ...(newPriority && { priority: newPriority }),
              }
            : complaint
        )
      );

      notification.success("Complaint status updated successfully!");
    } catch (err) {
      console.error("Error updating complaint status:", err);
      notification.error("Failed to update complaint status");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Failed to Load Complaints
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  // Show loading spinner while authentication is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has permission to view complaints
  if (!canViewComplaints) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <AlertCircleIcon size={64} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don’t have permission to view complaints.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator to get access to complaint management
            features.
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const resolvedCount = complaints.filter(
    (c) => c.status === "resolved"
  ).length;
  const urgentCount = complaints.filter((c) => c.priority === "urgent").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Complaint Management
          </h1>
          <p className="mt-2 text-gray-600">
            {canUpdateComplaints
              ? "View and manage complaints from students"
              : canCreateComplaints
              ? "Submit and track your complaints"
              : "View complaints"}
          </p>
        </div>

        <div className="flex gap-3">
          {canExportComplaints && (
            <PermissionGate permission="export_complaint_data">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={async () => {
                  try {
                    const resp = await fetch(
                      `/api/hostels/${hostelId}/complaints/export?format=csv`,
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "authToken"
                          )}`,
                        },
                      }
                    );
                    if (!resp.ok) throw new Error("Export failed");
                    const blob = await resp.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `complaints-${hostelId}-${
                      new Date().toISOString().split("T")[0]
                    }.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    notification.success("Complaints exported successfully");
                  } catch (e) {
                    console.error(e);
                    notification.error("Failed to export complaints");
                  }
                }}
              >
                <DownloadIcon size={16} className="mr-2" />
                Export CSV
              </Button>
            </PermissionGate>
          )}
          <PermissionGate permission="complaint_create">
            {user?.role === "student" && (
              <Button variant="primary" className="flex items-center">
                <PlusIcon size={16} className="mr-2" />
                Add New Complaint
              </Button>
            )}
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <PermissionGate permission="view_complaint_stats">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <AlertCircleIcon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {user?.role === "student"
                    ? "My Complaints"
                    : "Total Complaints"}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pagination?.total || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <ClockIcon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pendingCount}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircleIcon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {resolvedCount}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <XCircleIcon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {urgentCount}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </PermissionGate>

      {/* Filters and Search */}
      <PermissionGate permission="complaint_read">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <SearchIcon
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filters */}
            <div className="flex gap-2">
              {["pending", "in_progress", "resolved", "rejected"].map(
                (status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleStatusFilterChange(status)}
                  >
                    {status
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Button>
                )
              )}
            </div>

            {/* Priority Filters */}
            <div className="flex gap-2">
              {["urgent", "high", "medium", "low"].map((priority) => (
                <Button
                  key={priority}
                  variant={priorityFilter === priority ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handlePriorityFilterChange(priority)}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Button>
              ))}
            </div>

            {/* Clear Filters Button */}
            {(statusFilter || priorityFilter || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("");
                  setPriorityFilter("");
                  setSearchQuery("");
                  setPage(1);
                }}
                className="ml-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      </PermissionGate>

      {/* Complaints Table */}
      <PermissionGate permission="complaint_read">
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {canUpdateComplaints ? "Student" : "Status"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {canUpdateComplaints ? "Manage" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {complaint.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                          {complaint.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canUpdateComplaints ? (
                        // For users who can handle complaints, show student info
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {complaint.user?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {complaint.user?.email || "N/A"}
                          </div>
                          {/* Show room information if available */}
                          {complaint.user?.allocations &&
                            complaint.user.allocations.length > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                🏠 Room{" "}
                                {
                                  complaint.user.allocations[0]?.room
                                    ?.roomNumber
                                }
                                {complaint.user.allocations[0]?.room?.block &&
                                  ` (${complaint.user.allocations[0].room.block})`}
                              </div>
                            )}
                        </div>
                      ) : (
                        // For users who can only create/view, show status prominently
                        <div className="text-sm text-gray-900">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              complaint.status
                            )}`}
                          >
                            {complaint.status
                              ?.replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority?.charAt(0).toUpperCase() +
                          complaint.priority?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          complaint.status
                        )}`}
                      >
                        {complaint.status
                          ?.replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {complaint.createdAt
                        ? new Date(complaint.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {canUpdateComplaints ? (
                          // Users who can handle complaints can update status and priority
                          <>
                            {/* Status Update Dropdown */}
                            <div className="relative inline-block text-left">
                              <select
                                value={complaint.status}
                                onChange={(e) =>
                                  handleStatusUpdate(
                                    complaint.id,
                                    e.target.value as
                                      | "pending"
                                      | "in_progress"
                                      | "resolved"
                                      | "rejected"
                                  )
                                }
                                className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>

                            {/* Priority Update Dropdown */}
                            <div className="relative inline-block text-left">
                              <select
                                value={complaint.priority || "medium"}
                                onChange={(e) =>
                                  handleStatusUpdate(
                                    complaint.id,
                                    complaint.status,
                                    e.target.value as
                                      | "low"
                                      | "medium"
                                      | "high"
                                      | "urgent"
                                  )
                                }
                                className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>

                            {/* Delete Button */}
                            <PermissionGate permission="complaint_delete">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:border-red-300"
                                onClick={async () => {
                                  // Debug: Check if user actually has the permission
                                  console.log(
                                    "User permissions:",
                                    user?.permissions
                                  );
                                  console.log(
                                    "Has complaint_delete permission:",
                                    hasPermission("complaint_delete")
                                  );
                                  console.log(
                                    "canDeleteComplaints variable:",
                                    canDeleteComplaints
                                  );

                                  if (
                                    confirm(
                                      "Are you sure you want to delete this complaint?"
                                    )
                                  ) {
                                    try {
                                      const token =
                                        localStorage.getItem("authToken");

                                      // Log token information (only first few chars for security)
                                      if (token) {
                                        const tokenStart =
                                          token.substring(0, 15) + "...";
                                        console.log("Using token:", tokenStart);
                                      } else {
                                        console.warn("No auth token found!");
                                      }

                                      const response = await fetch(
                                        `/api/hostels/${hostelId}/complaints/${complaint.id}`,
                                        {
                                          method: "DELETE",
                                          headers: {
                                            Authorization: `Bearer ${token}`,
                                            "X-Debug-Permissions":
                                              user?.permissions?.join(",") ||
                                              "",
                                          },
                                        }
                                      );

                                      if (!response.ok) {
                                        // Handle different error statuses
                                        if (response.status === 403) {
                                          notification.error(
                                            "Permission denied: You do not have the required permission to delete complaints"
                                          );
                                          throw new Error(
                                            "Permission denied: complaint_delete permission required"
                                          );
                                        } else if (response.status === 404) {
                                          notification.error(
                                            "Complaint not found"
                                          );
                                          throw new Error(
                                            "Complaint not found"
                                          );
                                        } else {
                                          throw new Error(
                                            `Failed to delete complaint: ${response.status}`
                                          );
                                        }
                                      }

                                      // Success - remove complaint from local state
                                      setAllComplaints((prev) =>
                                        prev.filter(
                                          (c) => c.id !== complaint.id
                                        )
                                      );
                                      notification.success(
                                        "Complaint deleted successfully"
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Error deleting complaint:",
                                        error
                                      );
                                      // Don't show a generic error message here since we've already shown specific ones above
                                    }
                                  }
                                }}
                              >
                                <XCircleIcon size={14} />
                              </Button>
                            </PermissionGate>
                          </>
                        ) : (
                          // Other users can only view
                          <Button variant="outline" size="sm">
                            <EyeIcon size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= (pagination?.pages || 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </PermissionGate>
    </div>
  );
}
