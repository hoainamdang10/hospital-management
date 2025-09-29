"use client"

import React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  width?: string;
  iconSize?: number;
  iconPosition?: "left" | "right";
  onSubmit?: (e: React.FormEvent) => void;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  width = "w-full md:w-[300px]",
  iconSize = 16,
  iconPosition = "left",
  onSubmit
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative">
      {iconPosition === "left" && (
        <Search 
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" 
          size={iconSize} 
        />
      )}
      
      <Input
        type="search"
        placeholder={placeholder}
        className={`${iconPosition === "left" ? "pl-8" : "pr-8"} ${width} ${className}`}
        value={value}
        onChange={onChange}
      />
      
      {iconPosition === "right" && (
        <Search 
          className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" 
          size={iconSize} 
        />
      )}
    </form>
  )
}
