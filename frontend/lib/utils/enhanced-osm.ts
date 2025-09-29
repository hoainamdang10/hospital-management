// Enhanced OpenStreetMap utilities for Vietnam addresses
import { OSMAddressComponents } from "@/components/forms/OpenStreetMapAddressInput";

// Vietnam-specific constants
const VIETNAM_BOUNDS = {
  north: 23.393395,
  south: 8.179,
  east: 109.464638,
  west: 102.144778
};

const MAJOR_CITIES = [
  'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Biên Hòa', 'Huế', 'Nha Trang', 'Buôn Ma Thuột', 'Quy Nhon'
];

const VIETNAM_ABBREVIATIONS: { [key: string]: string } = {
  'tp': 'thành phố',
  'tphcm': 'thành phố hồ chí minh',
  'hn': 'hà nội',
  'dn': 'đà nẵng',
  'hp': 'hải phòng',
  'ct': 'cần thơ',
  'q': 'quận',
  'p': 'phường',
  'f': 'phường',
  'w': 'phường',
  'st': 'street',
  'rd': 'road',
  'ave': 'avenue',
  'blvd': 'boulevard'
};

// Cache for search results
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class OSMCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const osmCache = new OSMCache();

// Normalize Vietnamese text for better search
export function normalizeVietnameseText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Expand abbreviations
    .replace(/\b(tp|tphcm|hn|dn|hp|ct|q|p|f|w)\b/g, (match) => 
      VIETNAM_ABBREVIATIONS[match] || match
    )
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Handle common variations
    .replace(/thành phố hồ chí minh/g, 'ho chi minh city')
    .replace(/sài gòn/g, 'ho chi minh')
    .replace(/hà nội/g, 'hanoi');
}

// Enhanced search parameters for Vietnam
export function buildEnhancedSearchParams(query: string, options: {
  limit?: number;
  includeExtratags?: boolean;
  includeNamedetails?: boolean;
} = {}): URLSearchParams {
  const normalizedQuery = normalizeVietnameseText(query);
  
  const params = new URLSearchParams({
    format: 'json',
    q: normalizedQuery,
    countrycodes: 'vn',
    limit: (options.limit || 8).toString(),
    addressdetails: '1',
    'accept-language': 'vi,en',
    // Add viewbox for Vietnam bounds
    viewbox: `${VIETNAM_BOUNDS.west},${VIETNAM_BOUNDS.north},${VIETNAM_BOUNDS.east},${VIETNAM_BOUNDS.south}`,
    bounded: '1', // Restrict results to viewbox
    dedupe: '1', // Remove duplicate results
  });

  if (options.includeExtratags) {
    params.set('extratags', '1');
  }

  if (options.includeNamedetails) {
    params.set('namedetails', '1');
  }

  return params;
}

// Quality scoring for Vietnam addresses
export function scoreVietnameseAddress(result: any, originalQuery: string): number {
  let score = result.importance || 0;
  const displayName = result.display_name?.toLowerCase() || '';
  const normalizedQuery = normalizeVietnameseText(originalQuery);

  // Boost major cities
  for (const city of MAJOR_CITIES) {
    if (displayName.includes(city.toLowerCase())) {
      score += 0.3;
      break;
    }
  }

  // Boost if query terms are found in display name
  const queryTerms = normalizedQuery.split(' ');
  const matchedTerms = queryTerms.filter(term => 
    term.length > 2 && displayName.includes(term)
  );
  score += (matchedTerms.length / queryTerms.length) * 0.2;

  // Boost complete addresses (with house number)
  if (result.address?.house_number) {
    score += 0.1;
  }

  // Boost if has postal code
  if (result.address?.postcode) {
    score += 0.05;
  }

  // Penalize if missing important components
  if (!result.address?.city && !result.address?.state) {
    score -= 0.2;
  }

  return Math.max(0, Math.min(1, score));
}

// Multiple search strategies
export async function enhancedAddressSearch(query: string): Promise<any[]> {
  if (query.length < 3) return [];

  const cacheKey = `search:${query}`;
  const cached = osmCache.get(cacheKey);
  if (cached) return cached;

  const strategies = [
    // Strategy 1: Direct search with enhanced params
    () => searchWithParams(query, { limit: 8, includeExtratags: true }),
    
    // Strategy 2: Search with city boost
    () => searchWithCityBoost(query),
    
    // Strategy 3: Fallback with relaxed constraints
    () => searchWithFallback(query)
  ];

  for (const strategy of strategies) {
    try {
      const results = await strategy();
      if (results && results.length > 0) {
        // Score and sort results
        const scoredResults = results
          .map((result: any) => ({
            ...result,
            vietnamScore: scoreVietnameseAddress(result, query)
          }))
          .sort((a: any, b: any) => b.vietnamScore - a.vietnamScore)
          .slice(0, 5); // Top 5 results

        osmCache.set(cacheKey, scoredResults);
        return scoredResults;
      }
    } catch (error) {
      console.warn(`Search strategy failed:`, error);
      continue;
    }
  }

  return [];
}

// Strategy 1: Enhanced parameter search
async function searchWithParams(query: string, options: any): Promise<any[]> {
  const params = buildEnhancedSearchParams(query, options);
  
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        'User-Agent': 'Hospital-Management-System/2.0 Enhanced'
      }
    }
  );

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const results = await response.json();
  return filterVietnameseResults(results);
}

// Strategy 2: Search with major city boost
async function searchWithCityBoost(query: string): Promise<any[]> {
  // Try to detect if query contains a major city
  const detectedCity = MAJOR_CITIES.find(city => 
    normalizeVietnameseText(query).includes(city.toLowerCase())
  );

  if (detectedCity) {
    // Boost search by putting city first
    const boostedQuery = `${detectedCity}, ${query}`;
    return searchWithParams(boostedQuery, { limit: 5 });
  }

  return [];
}

// Strategy 3: Fallback search with relaxed constraints
async function searchWithFallback(query: string): Promise<any[]> {
  const params = new URLSearchParams({
    format: 'json',
    q: normalizeVietnameseText(query),
    countrycodes: 'vn',
    limit: '10',
    addressdetails: '1',
    'accept-language': 'vi,en',
    // Remove viewbox constraint for fallback
    dedupe: '1'
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        'User-Agent': 'Hospital-Management-System/2.0 Fallback'
      }
    }
  );

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const results = await response.json();
  return filterVietnameseResults(results);
}

// Filter and validate Vietnamese results
function filterVietnameseResults(results: any[]): any[] {
  return results.filter(result => {
    const country = result.address?.country;
    const displayName = result.display_name || '';
    
    return (
      country === 'Việt Nam' || 
      country === 'Vietnam' ||
      displayName.includes('Việt Nam') ||
      displayName.includes('Vietnam')
    );
  });
}

// Enhanced reverse geocoding
export async function enhancedReverseGeocode(lat: number, lon: number): Promise<any | null> {
  const cacheKey = `reverse:${lat.toFixed(6)},${lon.toFixed(6)}`;
  const cached = osmCache.get(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      format: 'json',
      lat: lat.toString(),
      lon: lon.toString(),
      addressdetails: '1',
      'accept-language': 'vi,en',
      extratags: '1',
      namedetails: '1',
      zoom: '18' // High detail level
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      {
        headers: {
          'User-Agent': 'Hospital-Management-System/2.0 Reverse'
        }
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    
    if (result && result.address) {
      osmCache.set(cacheKey, result, 10 * 60 * 1000); // 10 minutes cache
      return result;
    }
  } catch (error) {
    console.error('Enhanced reverse geocoding error:', error);
  }

  return null;
}

// Validate Vietnamese address format
export function validateVietnameseAddress(address: OSMAddressComponents): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check required components
  if (!address.city && !address.state) {
    issues.push('Thiếu thông tin tỉnh/thành phố');
    suggestions.push('Vui lòng chọn địa chỉ có đầy đủ thông tin tỉnh/thành phố');
  }

  if (!address.road && !address.suburb) {
    issues.push('Thiếu thông tin đường/phường');
    suggestions.push('Vui lòng chọn địa chỉ có thông tin đường hoặc phường');
  }

  // Check coordinates are within Vietnam
  if (address.lat && address.lon) {
    const { lat, lon } = address;
    if (
      lat < VIETNAM_BOUNDS.south || lat > VIETNAM_BOUNDS.north ||
      lon < VIETNAM_BOUNDS.west || lon > VIETNAM_BOUNDS.east
    ) {
      issues.push('Tọa độ nằm ngoài lãnh thổ Việt Nam');
      suggestions.push('Vui lòng chọn địa chỉ trong lãnh thổ Việt Nam');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

// Clear cache utility
export function clearOSMCache(): void {
  osmCache.clear();
}
