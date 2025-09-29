"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// OpenStreetMap Nominatim API types
export interface OSMAddressComponents {
  house_number?: string;
  road?: string;
  suburb?: string; // ward level
  neighbourhood?: string; // alternative ward level
  city_district?: string; // district level
  city?: string; // province level
  state?: string;
  country?: string;
  postcode?: string;
  display_name?: string;
  lat?: number;
  lon?: number;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address: OSMAddressComponents;
}

interface OpenStreetMapAddressInputProps {
  onAddressSelect: (address: OSMAddressComponents) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  required?: boolean;
  error?: string;
}

export default function OpenStreetMapAddressInput({
  onAddressSelect,
  placeholder = "Nhập địa chỉ của bạn...",
  defaultValue = "",
  className = "",
  required = false,
  error,
}: OpenStreetMapAddressInputProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] =
    useState<OSMAddressComponents | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Enhanced debounced search function
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      // Use enhanced search from utils
      const { enhancedAddressSearch } = await import(
        "@/lib/utils/enhanced-osm"
      );
      const results = await enhancedAddressSearch(query);

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error("Enhanced OSM search error:", error);
      setLoadError("Không thể tìm kiếm địa chỉ. Vui lòng thử lại.");
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setLoadError(null);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchAddresses(value);
    }, 500);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (result: NominatimResult) => {
    const addressComponents: OSMAddressComponents = {
      house_number: result.address.house_number,
      road: result.address.road,
      suburb: result.address.suburb || result.address.city_district,
      city_district: result.address.city_district,
      city: result.address.city || result.address.state,
      state: result.address.state,
      country: result.address.country,
      postcode: result.address.postcode,
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    };

    setInputValue(result.display_name);
    setSelectedAddress(addressComponents);
    setShowSuggestions(false);
    setSuggestions([]);

    // Call parent callback
    onAddressSelect(addressComponents);
  };

  // Handle current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLoadError("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use enhanced reverse geocoding
          const { enhancedReverseGeocode, validateVietnameseAddress } =
            await import("@/lib/utils/enhanced-osm");
          const result = await enhancedReverseGeocode(latitude, longitude);

          if (result && result.address) {
            const addressComponents: OSMAddressComponents = {
              house_number: result.address.house_number,
              road: result.address.road,
              suburb: result.address.suburb || result.address.city_district,
              city_district: result.address.city_district,
              city: result.address.city || result.address.state,
              state: result.address.state,
              country: result.address.country,
              postcode: result.address.postcode,
              display_name: result.display_name,
              lat: latitude,
              lon: longitude,
            };

            // Validate the address
            const validation = validateVietnameseAddress(addressComponents);
            if (!validation.isValid) {
              console.warn("Address validation issues:", validation.issues);
              // Still proceed but show warning
              setLoadError(
                `Địa chỉ có thể không chính xác: ${validation.issues[0]}`
              );
            }

            setInputValue(result.display_name);
            setSelectedAddress(addressComponents);
            onAddressSelect(addressComponents);
          } else {
            setLoadError("Không thể xác định địa chỉ từ vị trí hiện tại.");
          }
        } catch (error) {
          console.error("Enhanced reverse geocoding error:", error);
          setLoadError("Lỗi khi lấy địa chỉ từ vị trí hiện tại.");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        let errorMessage = "Không thể lấy vị trí hiện tại.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Vui lòng cho phép truy cập vị trí trong trình duyệt.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Không thể xác định vị trí. Vui lòng kiểm tra GPS.";
            break;
          case error.TIMEOUT:
            errorMessage = "Hết thời gian chờ. Vui lòng thử lại.";
            break;
        }

        setLoadError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="address-input">
        Địa chỉ {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            id="address-input"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={isLoading}
            className={`${className} ${error ? "border-red-500" : ""}`}
            required={required}
            autoComplete="off"
          />

          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.place_id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.display_name}
                        </p>
                        {/* Quality Score Indicator */}
                        {suggestion.vietnamScore && (
                          <div className="flex items-center gap-1 ml-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                suggestion.vietnamScore > 0.7
                                  ? "bg-green-500"
                                  : suggestion.vietnamScore > 0.5
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                              }`}
                            />
                            <span className="text-xs text-gray-400">
                              {Math.round(suggestion.vietnamScore * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {suggestion.type} • {suggestion.class}
                        {suggestion.address?.postcode &&
                          ` • ${suggestion.address.postcode}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="px-3"
          title="Sử dụng vị trí hiện tại"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Display */}
      {(error || loadError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || loadError}</AlertDescription>
        </Alert>
      )}

      {/* Selected Address Display */}
      {selectedAddress && (
        <div className="bg-green-50 p-3 rounded-md border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Địa chỉ đã chọn:
            </span>
          </div>
          <p className="text-sm text-green-700">
            {selectedAddress.display_name}
          </p>
          {selectedAddress.lat && selectedAddress.lon && (
            <p className="text-xs text-green-600 mt-1">
              📍 {selectedAddress.lat.toFixed(6)},{" "}
              {selectedAddress.lon.toFixed(6)}
            </p>
          )}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        💡 Gõ ít nhất 3 ký tự để tìm kiếm địa chỉ hoặc nhấn{" "}
        <MapPin className="inline h-3 w-3" /> để dùng vị trí hiện tại
      </p>
    </div>
  );
}
