"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"

export interface StatusBadgeProps {
  status: string;
  type: "room" | "gender" | "appointment" | "custom";
  customColors?: {
    bg: string;
    text: string;
  };
}

export function StatusBadge({ status, type, customColors }: StatusBadgeProps) {
  // Room status colors
  if (type === "room") {
    switch (status) {
      case "Available":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
      case "Occupied":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Occupied</Badge>
      case "Maintenance":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Maintenance</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  // Gender colors
  if (type === "gender") {
    switch (status) {
      case "Male":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Male</Badge>
      case "Female":
        return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">Female</Badge>
      case "Other":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Other</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  // Appointment status colors
  if (type === "appointment") {
    switch (status) {
      case "Scheduled":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>
      case "Completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "Cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>
      case "No-show":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">No-show</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  // Custom colors
  if (type === "custom" && customColors) {
    return (
      <Badge 
        className={`bg-${customColors.bg}-100 text-${customColors.text}-800 hover:bg-${customColors.bg}-100`}
      >
        {status}
      </Badge>
    )
  }
  
  // Default
  return <Badge>{status}</Badge>
}
