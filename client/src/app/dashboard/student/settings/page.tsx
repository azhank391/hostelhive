"use client";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function StudentSettingsPage() {
  return (
    <ProtectedRoute requiredRole="student">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">My Settings</h1>
            <p className="text-sm text-gray-500">
              Update your personal information
            </p>
          </CardHeader>
          <CardContent>
            <ProfileSettingsForm roleContext="student" />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
