import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import defaultConfig from './config.json'

export interface ConfigState {
  /** Backend API server */
  serverAddressURL: string
  /** Camera / Unison service */
  unisonAddressURL: string
  /** Depth-camera / RealSense dimensioning service */
  realSenseAddressURL: string
  /** Scale / CasPD2 weight service */
  casPD2AddressURL: string
  /** USPS CASS address-validation service */
  cassAddressURL: string
  /** USPS Label / postage API */
  labelAddressURL: string
  /** Payment terminal service */
  paymentAddressURL: string
  /** Weight unit displayed to the customer */
  unit: 'lb' | 'kg'
}

const initialState: ConfigState = defaultConfig as ConfigState

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    replaceConfig(_state, action: PayloadAction<ConfigState>) {
      return action.payload
    },
    setServerAddressURL(state, action: PayloadAction<string>) {
      state.serverAddressURL = action.payload
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
    setCassAddressURL(state, action: PayloadAction<string>) {
      state.cassAddressURL = action.payload
    },
    setLabelAddressURL(state, action: PayloadAction<string>) {
      state.labelAddressURL = action.payload
    },
    setPaymentAddressURL(state, action: PayloadAction<string>) {
      state.paymentAddressURL = action.payload
    },
    setUnit(state, action: PayloadAction<'lb' | 'kg'>) {
      state.unit = action.payload
    }
  }
})

export const {
  replaceConfig,
  setServerAddressURL,
  setUnisonAddressURL,
  setRealSenseAddressURL,
  setCasPD2AddressURL,
  setCassAddressURL,
  setLabelAddressURL,
  setPaymentAddressURL,
  setUnit
} = configSlice.actions

export default configSlice.reducer
