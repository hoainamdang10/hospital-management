"use client"

import React from "react"

export interface LoadingIndicatorProps {
  size?: "small" | "medium" | "large";
  text?: string;
  fullWidth?: boolean;
  color?: string;
}

export function LoadingIndicator({
  size = "medium",
  text = "Loading...",
  fullWidth = false,
  color = "blue"
}: LoadingIndicatorProps) {
  // Determine spinner size
  const spinnerSize = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12"
  }[size];
  
  // Determine text size
  const textSize = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base"
  }[size];
  
  // Determine color
  const spinnerColor = `border-${color}-600`;
  
  return (
    <div className={`flex justify-center items-center ${fullWidth ? 'w-full p-8' : ''}`}>
      <div className={`animate-spin rounded-full ${spinnerSize} border-b-2 ${spinnerColor}`}></div>
      {text && <span className={`ml-2 ${textSize}`}>{text}</span>}
    </div>
  )
}

// Variant with table cell
export function TableLoadingIndicator({
  colSpan,
  text = "Loading data...",
  color = "blue"
}: {
  colSpan: number;
  text?: string;
  color?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-4 text-center">
        <div className="flex justify-center items-center space-x-2">
          <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-${color}-600`}></div>
          <span>{text}</span>
        </div>
      </td>
    </tr>
  )
}
