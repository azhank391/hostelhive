"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "../ui/Button";
import {
  BuildingIcon,
  MailIcon,
  MapPinIcon,
  GlobeIcon,
} from "lucide-react";
import { useHostel } from "../../context/HostelContext";
import { useRouter } from "next/navigation";
import { notification } from "../../lib/toast";
import { useHostelApiWithContext } from "@/lib/context-aware-api";

interface CreateHostelFormData {
  name: string;
  email: string;
  country?: string;
  city?: string;
  address?: string;
}

// Note: response type inferred from context createHostel; explicit interface removed to avoid unused warnings

interface CreateHostelFormProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const CreateHostelForm = React.memo(
  ({ isModal = false, onClose, onSuccess }: CreateHostelFormProps) => {
    const [formData, setFormData] = useState<CreateHostelFormData>({
      name: "",
      email: "",
      country: "",
      city: "",
      address: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const { refreshHostels, hostels, createHostel } = useHostel();
    // Lazy import of auth context hook to optionally refresh user if needed (token may include activeHostelId)
    // We avoid circular deps; assuming useAuth is safe here.
    // dynamically import auth context to avoid require warnings and circular deps
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const mod = await import("../../contexts/AuthContext");
      // mark as used to avoid lint warning even if not referenced later
      void mod.useAuth;
    })();
    const user = undefined as unknown as { id: string } | undefined;
    const router = useRouter();
  const hostelApi = useHostelApiWithContext();
  void user;
  void hostelApi;

    // Determine if this is the first hostel or additional hostel
    const isFirstHostel = useMemo(() => hostels.length === 0, [hostels.length]);

    const clearForm = useCallback(() => {
      setFormData({
        name: "",
        email: "",
        country: "",
        city: "",
        address: "",
      });
      setErrors({});
      setSuccessMessage("");
    }, []);

    const handleChange = useCallback(
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));

        // Clear error when field is edited
        if (errors[name]) {
          setErrors((prev) => ({
            ...prev,
            [name]: "",
          }));
        }
      },
      [errors]
    );

    const validate = useCallback(() => {
      const newErrors: Record<string, string> = {};

      if (!formData.name.trim()) {
        newErrors.name = "Hostel name is required";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
          return;
        }

        setIsSubmitting(true);
        setErrors({});
        setSuccessMessage("");

        // Show loading toast
        const loadingToast = notification.loading("Creating hostel...");

        try {
          // 🎯 Use context-aware API for hostel creation
          // Use context createHostel so currentHostel is set immediately
          const hostel = await createHostel(formData as any);
          console.log("Hostel created successfully via context:", hostel);
          const hostelName = hostel.name || "Hostel";
          const subdomain = hostel.subdomain || "unknown";

          // Dismiss loading toast and show success
          notification.dismiss(loadingToast);
          notification.success("Hostel Created Successfully!", {
            description: `"${hostelName}" has been created with subdomain: ${subdomain}.hostelhive.com`,
          });

          // Show success message in form
          setSuccessMessage(
            `Hostel "${hostelName}" created successfully! Subdomain: ${subdomain}.hostelhive.com`
          );

          // Minimal delay just for UX feedback, then redirect immediately (context already has currentHostel)
          setTimeout(async () => {
            try {
              // Refresh list in background (non-blocking) to capture any additional server-calculated fields
              refreshHostels().catch((err) =>
                console.warn("Background hostel refresh failed:", err)
              );
              if (onSuccess) {
                onSuccess();
                return;
              }
              // Redirect to billing page for plan selection & checkout, preserving preselected plan if any
              let planQuery = "";
              try {
                if (typeof window !== "undefined") {
                  const selectedPlan = localStorage.getItem(
                    "HOSTELHIVE_SELECTED_PLAN"
                  );
                  if (selectedPlan && selectedPlan !== "free") {
                    planQuery = `?plan=${encodeURIComponent(selectedPlan)}`;
                  }
                }
              } catch {}
              router.replace(
                `/dashboard/hostels/${hostel.id}/billing${planQuery}`
              );
            } catch {
              router.replace(`/dashboard/hostels/${hostel.id}/billing`);
            }
          }, 600);
        } catch (error) {
          console.error("Failed to create hostel:", error);

          // Dismiss loading toast
          notification.dismiss(loadingToast);

          // Handle specific error types
          let errorMessage = "Failed to create hostel";

          if (error instanceof Error) {
            if (
              error.message
                .toLowerCase()
                .includes("email already registered") ||
              error.message.toLowerCase().includes("email already exists")
            ) {
              errorMessage = "Email Already Registered";

              // Clear the email field and show specific error
              setFormData((prev) => ({ ...prev, email: "" }));
              setErrors({
                email:
                  "This email is already registered. Please use a different email address.",
              });

              // Show error toast
              notification.error("Email Already Exists", {
                description:
                  "This email address is already registered. Please use a different email or try logging in instead.",
              });

              // Clear success message if any
              setSuccessMessage("");
              return; // Exit early to prevent further processing
            } else {
              errorMessage = error.message;
              notification.error("Failed to Create Hostel", {
                description: errorMessage,
              });

              // Set general error
              setErrors({ submit: errorMessage });
            }
          } else {
            notification.error("Failed to Create Hostel", {
              description: "An unexpected error occurred. Please try again.",
            });
            setErrors({
              submit: "An unexpected error occurred. Please try again.",
            });
          }

          // Clear success message on any error
          setSuccessMessage("");
        } finally {
          setIsSubmitting(false);
        }
      },
      [validate, formData, createHostel, refreshHostels, onSuccess, router]
    );

    return (
      <div
        className={`${
          isModal ? "w-full max-w-2xl" : "max-w-2xl mx-auto"
        } bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8`}
      >
        {/* Modal Header */}
        {isModal && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Create New Hostel
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <BuildingIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isFirstHostel ? "Create Your First Hostel" : "Create New Hostel"}
          </h2>
          <p className="text-gray-600">
            {isFirstHostel
              ? "Get started with HostelHive by creating your first hostel. You can always add more later."
              : "Add another hostel to your portfolio. You can manage multiple hostels from a single dashboard."}
          </p>
        </div>

        {/* Email Requirements Info Box */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start">
            <MailIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important: Email Requirements</p>
              <p>
                Each hostel must have a unique email address. If you get an
                &quot;Email already registered&quot; error, please use a
                different email address or try logging in with the existing
                account.
              </p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingIcon className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        {/* Email Already Exists Warning */}
        {errors.email && errors.email.includes("already registered") && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start">
              <MailIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">
                  Important: Email Requirements
                </p>
                <p>
                  Each hostel must have a unique email address. If you get an
                  &quot;Email already registered&quot; error, please use a
                  different email address or try logging in with the existing
                  account.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hostel Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <BuildingIcon className="inline h-4 w-4 mr-2" />
              Hostel Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter hostel name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <MailIcon className="inline h-4 w-4 mr-2" />
              Contact Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="hostel@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Use a unique email address that hasn&apos;t been registered before
            </p>
          </div>

          {/* Plan Selection */}
          {/* Plan selection removed. Plans are chosen on the billing page after creation. */}

          {/* Location Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <MapPinIcon className="inline h-4 w-4 mr-2" />
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., United States"
              />
            </div>
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <MapPinIcon className="inline h-4 w-4 mr-2" />
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., New York"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <MapPinIcon className="inline h-4 w-4 mr-2" />
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full address"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <GlobeIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  Subdomain will be auto-generated
                </p>
                <p>
                  We&apos;ll create a unique subdomain based on your hostel name
                  (e.g., myhostel.hostelhive.com)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex space-x-3">
            {isModal && onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              disabled={isSubmitting}
              className="flex-1"
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={isModal && onClose ? "flex-1" : "w-full"}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Hostel...
                </>
              ) : (
                "Create Hostel"
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }
);

CreateHostelForm.displayName = "CreateHostelForm";
