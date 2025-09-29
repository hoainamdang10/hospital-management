"use client"

import React, { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Google Places API types
declare global {
  interface Window {
    google: any
    initGooglePlaces: () => void
  }
}

export interface AddressComponents {
  street_number?: string
  route?: string
  ward?: string // sublocality_level_1
  district?: string // administrative_area_level_2  
  province?: string // administrative_area_level_1
  country?: string
  postal_code?: string
  formatted_address?: string
  lat?: number
  lng?: number
}

interface GooglePlacesAddressInputProps {
  onAddressSelect: (address: AddressComponents) => void
  placeholder?: string
  defaultValue?: string
  className?: string
  required?: boolean
  error?: string
}

export default function GooglePlacesAddressInput({
  onAddressSelect,
  placeholder = "Nhập địa chỉ của bạn...",
  defaultValue = "",
  className = "",
  required = false,
  error
}: GooglePlacesAddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState(defaultValue)

  // Initialize Google Places API
  useEffect(() => {
    const initializeGooglePlaces = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleLoaded(true)
        initializeAutocomplete()
        return
      }

      // Load Google Places API
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places&callback=initGooglePlaces`
      script.async = true
      script.defer = true
      
      // Global callback function
      window.initGooglePlaces = () => {
        setIsGoogleLoaded(true)
        initializeAutocomplete()
      }

      script.onerror = () => {
        setLoadError("Không thể tải Google Places API. Vui lòng kiểm tra kết nối internet.")
      }

      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
        delete window.initGooglePlaces
      }
    }

    initializeGooglePlaces()
  }, [])

  // Initialize autocomplete when Google is loaded
  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google) return

    try {
      // Create autocomplete instance with Vietnam bias
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'VN' }, // Restrict to Vietnam
          fields: [
            'address_components',
            'formatted_address',
            'geometry.location',
            'name'
          ]
        }
      )

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', handlePlaceSelect)
    } catch (error) {
      console.error('Error initializing Google Places:', error)
      setLoadError("Lỗi khởi tạo Google Places API")
    }
  }

  // Handle place selection
  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace()
    
    if (!place || !place.address_components) {
      setLoadError("Không thể lấy thông tin địa chỉ. Vui lòng thử lại.")
      return
    }

    setIsLoading(true)

    try {
      // Parse address components
      const addressComponents: AddressComponents = {
        formatted_address: place.formatted_address
      }

      // Get coordinates
      if (place.geometry && place.geometry.location) {
        addressComponents.lat = place.geometry.location.lat()
        addressComponents.lng = place.geometry.location.lng()
      }

      // Parse address components
      place.address_components.forEach((component: any) => {
        const types = component.types

        if (types.includes('street_number')) {
          addressComponents.street_number = component.long_name
        } else if (types.includes('route')) {
          addressComponents.route = component.long_name
        } else if (types.includes('sublocality_level_1') || types.includes('ward')) {
          addressComponents.ward = component.long_name
        } else if (types.includes('administrative_area_level_2')) {
          addressComponents.district = component.long_name
        } else if (types.includes('administrative_area_level_1')) {
          addressComponents.province = component.long_name
        } else if (types.includes('country')) {
          addressComponents.country = component.long_name
        } else if (types.includes('postal_code')) {
          addressComponents.postal_code = component.long_name
        }
      })

      // Update input value
      setInputValue(place.formatted_address || '')
      
      // Call parent callback
      onAddressSelect(addressComponents)
      
      setLoadError(null)
    } catch (error) {
      console.error('Error parsing address:', error)
      setLoadError("Lỗi xử lý địa chỉ. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setLoadError(null)
  }

  // Handle current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLoadError("Trình duyệt không hỗ trợ định vị.")
      return
    }

    setIsLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        // Reverse geocoding to get address
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder()
          
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results: any[], status: string) => {
              setIsLoading(false)
              
              if (status === 'OK' && results[0]) {
                setInputValue(results[0].formatted_address)
                
                // Parse the result similar to place selection
                const addressComponents: AddressComponents = {
                  formatted_address: results[0].formatted_address,
                  lat: latitude,
                  lng: longitude
                }

                results[0].address_components.forEach((component: any) => {
                  const types = component.types

                  if (types.includes('street_number')) {
                    addressComponents.street_number = component.long_name
                  } else if (types.includes('route')) {
                    addressComponents.route = component.long_name
                  } else if (types.includes('sublocality_level_1')) {
                    addressComponents.ward = component.long_name
                  } else if (types.includes('administrative_area_level_2')) {
                    addressComponents.district = component.long_name
                  } else if (types.includes('administrative_area_level_1')) {
                    addressComponents.province = component.long_name
                  }
                })

                onAddressSelect(addressComponents)
              } else {
                setLoadError("Không thể xác định địa chỉ từ vị trí hiện tại.")
              }
            }
          )
        }
      },
      (error) => {
        setIsLoading(false)
        setLoadError("Không thể lấy vị trí hiện tại. Vui lòng cho phép truy cập vị trí.")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  return (
    <div className="space-y-2">
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
            placeholder={isGoogleLoaded ? placeholder : "Đang tải Google Places..."}
            disabled={!isGoogleLoaded || isLoading}
            className={`${className} ${error ? 'border-red-500' : ''}`}
            required={required}
          />
          
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCurrentLocation}
          disabled={!isGoogleLoaded || isLoading}
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
          <AlertDescription>
            {error || loadError}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Google Places */}
      {!isGoogleLoaded && !loadError && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Đang tải Google Places API...
          </AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      {isGoogleLoaded && (
        <p className="text-xs text-gray-500">
          💡 Gõ địa chỉ để tìm kiếm tự động hoặc nhấn <MapPin className="inline h-3 w-3" /> để dùng vị trí hiện tại
        </p>
      )}
    </div>
  )
}
