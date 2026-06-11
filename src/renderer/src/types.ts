export interface AddressSuggestion {
  full: string
  street: string
  city: string
  state: string
  zip: string
  /** Google Places place_id — present when sourced from Places Autocomplete */
  placeId?: string
}

export interface AddressRecord {
  name: string
  email?: string
  street: string
  city: string
  state: string
  zip: string
  isValidated: boolean
}

export interface ParcelData {
  size: string
  dimensions: string
  dimensionsMetric: string
  actualDimensions: string
  actualDimensionsMetric: string
  weight: number
  price: number
}
