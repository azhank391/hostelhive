"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHostel } from "../context/HostelContext";
import { BuildingIcon } from "lucide-react";
import { ShareableLink } from "./ShareableLink";

export function HostelSelector() {
  const { currentHostel, hostels, setActiveHostel, isMultiHostelOwner } =
    useHostel();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Hide selector if user has only one hostel
  if (!isMultiHostelOwner) return null;

  const handleHostelChange = async (hostelId: string) => {
    if (loading) return;

    try {
      setLoading(true);
      // Update the hostel context
      await setActiveHostel(hostelId);
      // 🚀 CRITICAL FIX: Navigate to the correct hostel-specific dashboard URL
      router.push(`/dashboard/hostels/${hostelId}`);
    } catch (error) {
      console.error("Failed to switch hostel:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Left side - Hostel selection */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <BuildingIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">
              Active Hostel:
            </span>
          </div>

          <select
            value={currentHostel?.id || ""}
            onChange={(e) => handleHostelChange(e.target.value)}
            disabled={loading}
            className={`px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors min-w-[180px] sm:min-w-[200px] ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <option value="" disabled>
              {loading ? "Switching..." : "Select Hostel"}
            </option>
            {hostels.map((hostel) => (
              <option key={hostel.id} value={hostel.id}>
                {hostel.name} ({hostel.subdomain || hostel.id})
              </option>
            ))}
          </select>
        </div>

        {/* Right side - Info and Shareable Link */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <ShareableLink />

          <div className="text-sm text-gray-500">
            {hostels.length} hostel{hostels.length !== 1 ? "s" : ""} available
          </div>

          {currentHostel && (
            <div className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
              Plan: {currentHostel.plan_id || "basic"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for mobile or tight spaces
 */
export function CompactHostelSelector() {
  const { currentHostel, hostels, setActiveHostel, isMultiHostelOwner } =
    useHostel();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isMultiHostelOwner) return null;

  const handleHostelChange = async (hostelId: string) => {
    if (loading) return;

    try {
      setLoading(true);
      // Update the hostel context
      await setActiveHostel(hostelId);
      // Navigate to the dashboard with the selected hostel ID
      router.push(`/dashboard/hostels/${hostelId}`);
    } catch (error) {
      console.error("Failed to switch hostel:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
      <BuildingIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
      <span className="text-xs text-gray-600 font-medium">Hostel:</span>
      <select
        value={currentHostel?.id || ""}
        onChange={(e) => handleHostelChange(e.target.value)}
        disabled={loading}
        className={`text-xs border-0 bg-transparent focus:outline-none font-medium text-gray-800 min-w-[100px] sm:min-w-[120px] ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <option value="" disabled>
          {loading ? "Switching..." : "Select"}
        </option>
        {hostels.map((hostel) => (
          <option key={hostel.id} value={hostel.id}>
            {hostel.name}
          </option>
        ))}
      </select>
    </div>
  );
}
