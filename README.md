# PostalPulse Express

A self-service shipping kiosk built with Electron, React, and TypeScript for USPS retail locations. Customers place a parcel, have it measured and weighed automatically, enter sender and recipient addresses, pay postage, and print a shipping label — all without staff assistance.

---

## Overview

PostalPulse Express combines optical dimensioning, integrated scale weight, Google Maps address resolution, USPS CASS address validation, payment processing, and label generation into a single guided touchscreen workflow.

### Kiosk Steps

| Step | Description |
|---|---|
| **Welcome** | Start Shipment prompt |
| **Detection** | Depth camera + scale captures parcel dimensions and weight |
| **Confirmation** | Customer reviews detected parcel tier and price |
| **Sender Address** | Smart search (Google Places) + CASS validation |
| **Recipient Address** | Smart search (Google Places) + CASS validation |
| **Verify** | Full shipment summary — To, From, parcel, total cost |
| **Payment** | EMV / NFC / MSR card transaction |
| **Success** | Tracking number display, label print, session clear |

### Flat Rate Tiers

| Tier | Max Dimensions | Max Weight | Price |
|---|---|---|---|
| Small Flat Rate | 8.7 × 5.5 × 1.7 in | 1 lb | $10.20 |
| Medium Flat Rate | 11.3 × 8.8 × 6.0 in | 3 lb | $17.10 |
| Large Flat Rate | 12.3 × 12.0 × 6.0 in | 5 lb | $22.80 |

---

## Project Setup

### Install

> Requires **Node.js v20+**

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/) |
| UI | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Animation | [Motion / Framer Motion](https://motion.dev/) |
| State | [Redux Toolkit](https://redux-toolkit.js.org/) |
| Config persistence | [electron-store v8](https://github.com/sindresorhus/electron-store) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## Architecture

### Main Process (`src/main/index.ts`)

- Creates the kiosk `BrowserWindow`
- Persists kiosk configuration via `electron-store`
- Proxies all Google Maps API requests through `net.request()` via IPC to bypass renderer CORS/CSP in both dev and production

### Preload (`src/preload/index.ts`)

Exposes a typed `window.api` surface to the renderer via `contextBridge`:

| Method | Description |
|---|---|
| `getConfig()` | Load persisted kiosk config |
| `setConfig(config)` | Save kiosk config |
| `googleMapsGet(opts)` | Proxy HTTP request to Google Maps APIs |

### Renderer (`src/renderer/src/`)

Single-page React app. Step routing is managed in `App.tsx` using a `currentStep` string; each step is a separate component under `steps/`.

```
App.tsx               — step orchestrator, idle timer, timeout modal
steps/
  WelcomeStep         — hero landing
  DetectionStep       — parcel scan progress + error handling
  ConfirmationStep    — tier review
  AddressStep         — sender & recipient (shared component, remounts per step)
  VerifyStep          — shipment summary
  PaymentStep         — payment simulation
  SuccessStep         — confirmation + reset
components/
  Header              — logo (5-tap config unlock) + Verified Hub badge
  PriorityStripes     — USPS decorative stripe element
pages/Config/         — kiosk settings overlay
features/config/      — Redux slice + config.json defaults
contexts/KeyboardProvider/ — on-screen keyboard overlay for touchscreen input
```

---

## Address Entry & Validation

Address collection uses a two-stage Google Maps pipeline routed entirely through the Electron main process (no renderer-side API calls):

1. **Places API (New) — Autocomplete** (`POST places.googleapis.com/v1/places:autocomplete`)  
   Debounced 400 ms; returns prediction stubs with `placeId`.

2. **Places API (New) — Place Details** (`GET places.googleapis.com/v1/places/{placeId}`)  
   Resolves `addressComponents` → `street / city / state / zip`.

3. **Address Validation API — CASS** (`POST addressvalidation.googleapis.com/v1:validateAddress`)  
   Returns USPS-standardized address with ZIP+4. Sets `isValidated: true` only when `uspsData.cassProcessed: true`.

Manual entry mode provides individual Street / City / State / Zip fields plus an explicit **CASS Validate** button.

### Validation Badges

| Badge | Condition |
|---|---|
| Blue spinner | CASS request in-flight |
| Green — "Entry Validation Sync: 100%" | `isValidated: true` (CASS certified) |
| Amber — "Address Not CASS Validated" | Street populated but `isValidated: false` |

### Mock Mode

Set `MOCK_GOOGLE_MAPS = true` in `constants.ts` to bypass all API calls and use local `MOCK_ADDRESSES` with simulated CASS processing. Flip to `false` when a real API key is configured.

---

## Configuration

Access the config overlay by tapping the logo **5 times** within 1.5 seconds. Settings are persisted via `electron-store`.

| Setting | Description |
|---|---|
| Backend Server URL | Core API gateway |
| Camera / Unison URL | RGB + depth camera stream |
| Dimensioning / RealSense URL | Parcel volumetric service |
| Scale / CasPD2 URL | Integrated scale weight |
| Label / Postage API URL | USPS label generation |
| Payment Terminal URL | EMV / NFC terminal service |
| Google Maps API Key | Places Autocomplete & Address Validation (CASS) |

> **Required Google Cloud APIs:** Places API (New), Address Validation API

---

## Session Management

- `IDLE_TIMEOUT_SEC` in `constants.ts` controls the inactivity timeout (set to `0` to disable)
- After timeout, a countdown modal appears (`COUNTDOWN_SEC` seconds); if dismissed with no action, all session data clears and the kiosk returns to Welcome
- Navigating back to Detection from Confirmation resets both sender and recipient address state
- On full reset (timeout or Success → restart): parcel data, sender, and recipient are all cleared
