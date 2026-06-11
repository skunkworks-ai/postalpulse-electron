import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import defaultConfig from './config.json'

export interface ConfigState {
  /** Camera / Unison service */
  unisonAddressURL: string
  /** Depth-camera / RealSense dimensioning service */
  realSenseAddressURL: string
  /** Scale / CasPD2 weight service */
  casPD2AddressURL: string
  /** Weight unit displayed to the customer */
  unit: 'lb' | 'kg'
  /** Google Maps API key for Places Autocomplete & Address Validation */
  googleMapsApiKey: string
}

const initialState: ConfigState = defaultConfig as ConfigState

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    replaceConfig(_state, action: PayloadAction<ConfigState>) {
      return action.payload
    },
    setUnisonAddressURL(state, action: PayloadAction<string>) {
      state.unisonAddressURL = action.payload
    },
    setRealSenseAddressURL(state, action: PayloadAction<string>) {
      state.realSenseAddressURL = action.payload
    },
    setCasPD2AddressURL(state, action: PayloadAction<string>) {
      state.casPD2AddressURL = action.payload
    },
    setUnit(state, action: PayloadAction<'lb' | 'kg'>) {
      state.unit = action.payload
    },
    setGoogleMapsApiKey(state, action: PayloadAction<string>) {
      state.googleMapsApiKey = action.payload
    }
  }
})

export const {
  replaceConfig,
  setUnisonAddressURL,
  setRealSenseAddressURL,
  setCasPD2AddressURL,
  setUnit,
  setGoogleMapsApiKey
} = configSlice.actions

export default configSlice.reducer
