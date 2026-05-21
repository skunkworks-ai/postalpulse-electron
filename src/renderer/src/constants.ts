import type { AddressSuggestion } from './types'

export const BOX_SPECS = {
  SMALL: { name: 'SMALL FLAT RATE', maxL: 8.7, maxW: 5.5, maxH: 1.7, maxWeight: 1, price: 10.2 },
  MEDIUM: { name: 'MEDIUM FLAT RATE', maxL: 11.3, maxW: 8.8, maxH: 6.0, maxWeight: 3, price: 17.1 },
  LARGE: { name: 'LARGE FLAT RATE', maxL: 12.3, maxW: 12.0, maxH: 6.0, maxWeight: 5, price: 22.8 }
}

export const STEPS = {
  WELCOME: 'WELCOME',
  DETECTION: 'DETECTION',
  CONFIRMATION: 'CONFIRMATION',
  SENDER: 'SENDER',
  RECIPIENT: 'RECIPIENT',
  VERIFY: 'VERIFY',
  PAYMENT: 'PAYMENT',
  SUCCESS: 'SUCCESS'
}

export const IDLE_TIMEOUT_SEC = 0
export const COUNTDOWN_SEC = 10

// Set to true to bypass all Google Maps API calls and use mock data locally
export const MOCK_GOOGLE_MAPS = true

export const MOCK_ADDRESSES: AddressSuggestion[] = [
  {
    full: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
    street: '1600 Pennsylvania Avenue NW',
    city: 'Washington',
    state: 'DC',
    zip: '20500'
  },
  {
    full: '1400 Pennsylvania Avenue NW, Washington, DC 20004',
    street: '1400 Pennsylvania Avenue NW',
    city: 'Washington',
    state: 'DC',
    zip: '20004'
  },
  {
    full: '221B Baker Street, London, OH 43140',
    street: '221B Baker Street',
    city: 'London',
    state: 'OH',
    zip: '43140'
  },
  {
    full: '300 Baker Street, San Francisco, CA 94103',
    street: '300 Baker Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94103'
  },
  {
    full: '742 Evergreen Terrace, Springfield, IL 62704',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zip: '62704'
  },
  {
    full: '800 Evergreen Terrace, Springfield, MO 65806',
    street: '800 Evergreen Terrace',
    city: 'Springfield',
    state: 'MO',
    zip: '65806'
  },
  {
    full: '123 Main St, New York, NY 10001',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001'
  },
  {
    full: '456 Main St, Los Angeles, CA 90012',
    street: '456 Main St',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90012'
  },
  {
    full: '789 Main St, Chicago, IL 60601',
    street: '789 Main St',
    city: 'Chicago',
    state: 'IL',
    zip: '60601'
  },
  {
    full: '456 Ocean Drive, Miami, FL 33139',
    street: '456 Ocean Drive',
    city: 'Miami',
    state: 'FL',
    zip: '33139'
  },
  {
    full: '1200 Ocean Drive, Miami Beach, FL 33139',
    street: '1200 Ocean Drive',
    city: 'Miami Beach',
    state: 'FL',
    zip: '33139'
  },
  {
    full: '350 Fifth Avenue, New York, NY 10118',
    street: '350 Fifth Avenue',
    city: 'New York',
    state: 'NY',
    zip: '10118'
  },
  {
    full: '500 Fifth Avenue, New York, NY 10110',
    street: '500 Fifth Avenue',
    city: 'New York',
    state: 'NY',
    zip: '10110'
  },
  {
    full: '1 Infinite Loop, Cupertino, CA 95014',
    street: '1 Infinite Loop',
    city: 'Cupertino',
    state: 'CA',
    zip: '95014'
  },
  {
    full: '1 Apple Park Way, Cupertino, CA 95014',
    street: '1 Apple Park Way',
    city: 'Cupertino',
    state: 'CA',
    zip: '95014'
  }
]
