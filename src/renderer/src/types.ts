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
  /** BOX_SPECS packaging fee set at detection — never overwritten by postage */
  boxPrice: number
  /** Payable total (box + selected postage once chosen) */
  price: number
}

export interface ShippingRate {
  service: string
  price: number
  deliveryDays: number
}
