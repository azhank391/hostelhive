"use client";

import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";

export function ToastProvider() {
  const router = useRouter();

  useEffect(() => {
    // Listen for global quota exceeded events dispatched by the API client
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      const detail = (custom?.detail ?? {}) as {
        message?: string;
        upgradeUrl?: string;
        resource?: string;
        limit?: number | string;
      };
      const message = detail.message || "Plan limit reached";
      const upgradeUrl = detail.upgradeUrl || "/dashboard/billing";

      toast.error(message, {
        description: "Upgrade your plan to continue.",
        action: {
          label: "Upgrade",
          onClick: () => router.push(upgradeUrl),
        },
        duration: 6000,
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener(
        "HOSTELHIVE_QUOTA_EXCEEDED",
        handler as EventListener
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "HOSTELHIVE_QUOTA_EXCEEDED",
          handler as EventListener
        );
      }
    };
  }, [router]);

  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors
      closeButton
      toastOptions={{
        className: "font-sans",
        duration: 3000,
      }}
    />
  );
}
