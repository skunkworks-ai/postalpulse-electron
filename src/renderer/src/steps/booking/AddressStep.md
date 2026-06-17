# AddressStep

`src/renderer/src/steps/AddressStep.tsx`

Handles both **SENDER** (Section A) and **RECIPIENT** (Section B) address collection. The same component is mounted twice — the `key={currentStep}` in `App.tsx` forces a full remount on transition, so all local state resets automatically.

---

## Props

| Prop | Type | Description |
|---|---|---|
| `currentStep` | `string` | `STEPS.SENDER` or `STEPS.RECIPIENT` — drives all conditional UI |
| `sender` | `AddressRecord` | Sender state owned by `App` |
| `setSender` | `Dispatch` | Setter for sender |
| `recipient` | `AddressRecord` | Recipient state owned by `App` |
| `setRecipient` | `Dispatch` | Setter for recipient |
| `onBack` | `() => void` | Navigate back (SENDER → CONFIRMATION, RECIPIENT → SENDER) |
| `onNext` | `() => void` | Navigate forward (SENDER → RECIPIENT, RECIPIENT → VERIFY) |

`current` / `setCurrent` are derived internally from `isSender` — components always write to the active record without branching.

---

## Local State

| State | Type | Purpose |
|---|---|---|
| `isManualEntry` | `boolean` | Toggles between search mode and manual field grid |
| `addressSearch` | `string` | Controlled value for the address search input |
| `suggestions` | `AddressSuggestion[]` | Filtered results shown in the dropdown |
| `isValidating` | `boolean` | True while CASS validation request is in-flight — shows spinner banner and disables validate button |

All four reset on remount (step change).

---

## Address Entry Modes

### Search Mode (default)

As the user types into the search field (minimum 3 characters, 400 ms debounce), the component calls the **Google Maps Places API (New) Autocomplete** endpoint via IPC. A suggestion list appears below the input showing each prediction's full address string. Tapping a suggestion:

1. Calls **Place Details (New)** to resolve `address_components` → `street / city / state / zip`
2. Immediately calls **Address Validation API** (CASS) with those fields
3. If `cassProcessed: true`, overwrites fields with USPS-standardized values (uppercase, ZIP+4 appended) and sets `isValidated: true`
4. If CASS fails or is unavailable, uses the Places-resolved fields with `isValidated: false`

When no API key is configured, suggestions fall back to `MOCK_ADDRESSES` in `constants.ts` and no CASS call is made.

- "Override Manual" button switches to manual field-by-field entry

### Manual Mode
- Inline grid: Street (full width), City, State, Zip
- Fields write directly to `current` record with `isValidated: false`
- **CASS Validate** button at the bottom of the grid runs `cassValidate()` on the entered fields — if `cassProcessed: true`, overwrites fields with USPS-standardized values and sets `isValidated: true`
- Button is disabled while validating or when Street/City/State are empty

---

## CASS Validation (`cassValidate`)

Internal async helper. Calls the **Google Maps Address Validation API**:

- **Endpoint**: `POST https://addressvalidation.googleapis.com/v1:validateAddress`
- **Auth**: `X-Goog-Api-Key` header (same key as Places)
- **Body**: `{ address: { addressLines, locality, administrativeArea, postalCode, regionCode: "US" } }`

Returns `{ street, city, state, zip, isValidated }` or `null` on failure.

| Result | Behaviour |
|---|---|
| `uspsData.cassProcessed: true` | Returns USPS-standardized fields, `zip` includes ZIP+4 (e.g. `94043-1351`), `isValidated: true` |
| CASS not processed but postal address present | Returns Google-normalised fields, `isValidated: false` |
| Error / no API key | Returns `null` — caller falls back to previous values |

---

## Validation Badge

- **Blue spinner banner** — shown while `isValidating` is true
- **Green "Entry Validation Sync: 100%"** — shown when `current.isValidated === true` and not validating
- `isValidated` is only `true` after a successful CASS `cassProcessed` response

**Continue button** is disabled when `current.name` or `current.street` is empty.

---

## Progress Bar

A thin bar at the top of the card animates to `50%` width on SENDER and `100%` on RECIPIENT, reflecting overall address-collection progress.

---

## Integration Notes

- **Google Maps Places API (New) — Autocomplete**: `handleAddressSearch` sends a `POST` to `https://places.googleapis.com/v1/places:autocomplete` with a 400 ms debounce. API key passed via `X-Goog-Api-Key` header. Each prediction is a `{ full, placeId }` stub in `suggestions`.
- **Google Maps Places API (New) — Place Details**: `selectAddress` calls `GET https://places.googleapis.com/v1/places/{placeId}` with `X-Goog-FieldMask: addressComponents,formattedAddress`. Response fields are `longText` / `shortText` (not `long_name` / `short_name` from the legacy API).
- **Google Maps Address Validation API (CASS)**: `cassValidate` calls `POST https://addressvalidation.googleapis.com/v1:validateAddress`. Requires **Address Validation API** to be enabled in Google Cloud (separate from Places API — same key). Returns USPS-standardized address with ZIP+4 when `uspsData.cassProcessed: true`.
- **IPC proxy**: All three API calls go through `window.api.googleMapsGet(opts)` → `ipcMain.handle('google-maps-get')` → `net.request()` in the main process. This bypasses CORS and CSP in both dev and production Electron builds.
- **API key** — stored in `config.googleMapsApiKey` (Electron Store), configurable in the kiosk Config page (tap logo 5×). When blank, autocomplete falls back to `MOCK_ADDRESSES` and CASS is skipped.
- `AddressRecord` and `AddressSuggestion` (includes optional `placeId`) types are in `types.ts`
- Uses `ControlledInput` from `KeyboardProvider` context to support the on-screen keyboard overlay — `setValue` is wired directly to `handleAddressSearch` so both physical and on-screen keyboard input triggers the debounced search
