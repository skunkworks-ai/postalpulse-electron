## FUNCTIONAL SPECIFICATION DOCUMENT

## **PostalPulse Express Kiosk**

Prepared on  Apr 28, 2026

## **Executive Summary**

PostalPulse Express is an automated self-service shipping kiosk designed for USPS retail locations. The kiosk enables customers to place a parcel, have it measured and weighed automatically, validate sender and recipient addresses, pay postage, and print a shipping label without staff assistance.

The product reduces retail wait times, improves parcel classification accuracy, and protects revenue by combining optical dimensioning, weight verification, USPS CASS address validation, payment processing, and label generation into one guided customer workflow.

## **Solution Overview**

PostalPulse Express operates as a kiosk-based shipping workflow with integrated hardware, local processing, and USPS cloud services.

| Surface / Module | Purpose | Description |
| ----- | ----- | ----- |
| Landing Screen | Session start | Displays the Start Shipment prompt |
| Parcel Scanning | Parcel capture | Uses depth camera and scale data to detect, measure, and weigh the parcel |
| Classification | Shipping tier selection | Determines Small, Medium, or Large Flat Rate tier based on size and weight |
| Address Entry | Sender and recipient capture | Provides smart single-field search and CASS validation |
| Verification | Shipment review | Shows To, From, parcel details, and total cost |
| Payment | Transaction completion | Supports EMV, NFC, and MSR card payment |
| Finalization | Label fulfillment | Generates tracking number, prints label, and clears session data |

## **Goals and Objectives**

PostalPulse Express should make self-service parcel shipping fast, accurate, and secure.

The primary goals are to:

* Reduce customer wait times at USPS retail locations  
* Automate parcel dimensioning and weight validation  
* Prevent underpaid postage through tier verification  
* Ensure only CASS-verified addresses proceed to payment  
* Complete standard transactions in under 60 seconds  
* Protect customer PII by clearing session data after success or timeout

## **Scope**

This specification covers the core kiosk workflow from parcel placement through label printing.

### **In Scope**

* Parcel detection through depth camera input  
* Volumetric dimension calculation  
* Integrated scale weight capture  
* Parcel tier classification  
* Sender and recipient address entry  
* USPS CASS address validation  
* Payment terminal interaction  
* Tracking number and label generation  
* Thermal label and receipt printing  
* Inactivity timeout and session purge

### **Out of Scope**

* International shipping  
* Cash payment  
* Manual clerk override  
* Non-standard parcel handling beyond configured tier rules  
* Customer account login or loyalty features

## **Assumptions**

* The kiosk is deployed in a USPS retail environment.  
* USPS CASS API is available for address validation.  
* USPS postage and label services are available after payment approval.  
* Payment processing is handled by an EMV, NFC, and MSR-compliant terminal.  
* The depth camera is equivalent to Intel RealSense D555 or better.  
* The digital scale supports real-time USB or serial communication.  
* Session data includes PII and must be cleared after success, timeout, or reset.

## **Users and Roles**

| User / Role | Responsibility | Access Expectations |
| ----- | ----- | ----- |
| Customer | Completes the self-service shipment workflow | Can enter addresses, confirm parcel details, pay, and print label |
| Kiosk Backend | Coordinates hardware, validation, classification, payment, and printing | Has access to device APIs and USPS service integrations |
| USPS Systems | Validate addresses and generate postage labels | Receives backend requests for CASS validation and label creation |
| Payment Terminal | Processes card transactions | Returns approval or decline status to the kiosk flow |

## **Core Functional Requirements**

### Parcel Detection and Classification

The kiosk shall automatically detect when a parcel is placed on the scale, capture its dimensions through the depth camera, and combine dimensional data with stabilized weight readings.

The system shall support the following classification rules.

| Tier | Maximum Dimensions | Maximum Weight |
| ----- | ----- | ----- |
| Small Flat Rate | 8.7 x 5.5 x 1.7 in | 1 lb |
| Medium Flat Rate | 11.3 x 8.8 x 6.0 in | 3 lbs |
| Large Flat Rate | 12.3 x 12.0 x 6.0 in | 5 lbs |

If a parcel fits a smaller dimensional class but exceeds that class weight limit, the system shall reclassify the parcel to the next valid tier when allowed by configured rules.

### Address Management

The kiosk shall provide a hybrid address entry experience using a single-field smart search bar.

The system shall:

* Collect sender address first  
* Collect recipient address second  
* Validate each address through USPS CASS  
* Return either a standardized address or an error code  
* Block payment until both addresses are CASS-verified

### Payment and Fulfillment

The system shall initiate payment only after parcel classification and address validation are complete.

After payment approval, the backend shall:

* Request a USPS tracking number  
* Request the shipping label PDF or printable label payload  
* Send the print command to the thermal printer  
* Display a success confirmation

If payment is declined, the system shall display a transaction failure message and return the user to the summary or payment retry step.

### Session Security

The kiosk shall monitor inactivity throughout the session.

After 60 seconds of inactivity, the system shall display a warning modal with a 5-second countdown. If no user action occurs during the countdown, the system shall clear all session data and return to the landing screen.

## System Architecture

PostalPulse Express uses a local kiosk backend to coordinate hardware, edge processing, frontend state, and USPS cloud integrations.

| Layer | Responsibility | Components |
| ----- | ----- | ----- |
| Hardware Layer | Captures parcel, weight, payment, and print activity | Depth camera, integrated scale, touchscreen, payment terminal, thermal printer |
| Edge Processing Layer | Processes device input and calculates parcel attributes | Backend service, OpenCV, custom depth algorithms, weight stabilization logic |
| Application Layer | Manages kiosk workflow and UI state | React.js single-page application, WebSocket or REST polling |
| USPS Integration Layer | Validates addresses and generates labels | USPS CASS API, USPS postage label API |
| Transaction Layer | Completes payment and fulfillment | Payment terminal, tracking number request, print command |

The following diagram shows how parcel, address, payment, and label data move through the kiosk system.

The backend acts as the control point for device input, classification logic, USPS validation, payment completion, and print fulfillment. The frontend presents each workflow state to the customer and receives measurement updates from the backend through WebSocket or REST polling.

## Information Architecture

### Landing

The landing screen introduces the kiosk experience and displays a Start Shipment call to action.

### Placement

The placement screen instructs the user to place the parcel on the scale. Once the depth sensor and scale detect a parcel, the system transitions into scanning.

### Dimensioning

The dimensioning screen displays the scan status, live bounding box, detected dimensions, detected weight, and calculated parcel tier.

### Confirmation

The confirmation screen allows the user to review detected size and weight before entering address information.

### Sender Information

The sender information screen captures the return address through smart search and validates it through CASS.

### Recipient Information

The recipient information screen captures the destination address through smart search and validates it through CASS.

### Verification

The verification screen shows a shipment summary, including From, To, parcel classification, weight, dimensions, and total cost.

### Payment

The payment screen instructs the user to complete payment using the card terminal.

### Finalization

The finalization screen confirms success, prints the label, and instructs the user to deposit the parcel in the chute.

## Data Sources

| Source | Role | Data Provided |
| ----- | ----- | ----- |
| Depth Camera | Parcel dimension source | RGB stream, depth map, bounding volume |
| Digital Scale | Parcel weight source | Real-time weight readings |
| Touchscreen UI | Customer input source | Address searches, confirmations, payment flow actions |
| USPS CASS API | Address validation source | Standardized addresses, validation status, error codes |
| USPS Label API | Fulfillment source | Tracking number and label payload |
| Payment Terminal | Payment source | Approval, decline, and transaction status |
| Thermal Printer | Output device | Printed shipping label and receipt |

## Data Schema

The kiosk workflow is modeled around a shipping session. A session begins when the customer starts a shipment and ends when the shipment succeeds, times out, or resets. The session links parcel measurements, sender and recipient addresses, validation results, payment status, and label fulfillment.

### Schema Overview

The primary object is the Shipment Session. Supporting objects include Parcel Measurement, Address Record, Payment Transaction, Label Request, and Device Status. This structure allows the system to coordinate hardware input, validation results, and fulfillment while ensuring that PII can be purged at the end of the session.

### Core Entities

| Entity | Purpose | Key Notes |
| ----- | ----- | ----- |
| Shipment Session | Represents one customer kiosk interaction | Owns parcel, address, payment, and label data |
| Parcel Measurement | Stores detected dimensions, weight, and tier | Created from depth camera and scale readings |
| Address Record | Stores sender or recipient address | Must be CASS-verified before payment |
| Payment Transaction | Tracks terminal payment status | Required before label generation |
| Label Request | Tracks postage label and tracking generation | Created only after successful payment |
| Device Status | Tracks sensor, scale, printer, and terminal availability | Used for error handling and operational readiness |

### Entity Attributes

| Field | Type / Format | Description |
| ----- | ----- | ----- |
| session\_id | string | Unique session identifier |
| session\_state | enum | Current workflow state such as Landing, Scanning, Payment, or Finalized |
| dimensions | object | Length, width, and height in inches |
| weight | float | Stabilized parcel weight in pounds |
| tier | enum | Small, Medium, or Large Flat Rate |
| sender\_address\_status | enum | CASS validation state for sender address |
| recipient\_address\_status | enum | CASS validation state for recipient address |
| payment\_status | enum | Pending, Approved, Declined, or Failed |
| tracking\_number | string | USPS tracking number returned after label generation |
| label\_payload | file or URL | Printable label output |
| last\_activity\_at | timestamp | Last user interaction timestamp |
| created\_at | timestamp | Session creation timestamp |
| cleared\_at | timestamp | Timestamp when session data was purged |

### Normalized Status Values and Enumerations

| Field | Allowed Values | Notes |
| ----- | ----- | ----- |
| session\_state | Landing, Placement, Scanning, Confirmation, Sender Info, Recipient Info, Verification, Payment, Finalize, Timeout, Success | Drives frontend workflow state |
| tier | Small, Medium, Large, Not Eligible | Based on size and weight rules |
| address\_status | Not Entered, Pending, CASS-Verified, Failed | Payment requires both addresses to be CASS-Verified |
| payment\_status | Not Started, Pending, Approved, Declined, Failed | Declined transactions allow retry |
| device\_state | Ready, Busy, Error, Offline | Used for kiosk readiness and error messages |

### Derived Fields and Calculations

* Parcel volume is calculated from length x width x height.  
* Parcel tier is derived from dimensions and weight.  
* Weight stability is derived from scale readings over a short sampling window.  
* Timeout state is derived from last\_activity\_at plus the configured inactivity threshold.  
* Transaction duration is derived from session start time through success or reset.

### Data Governance Notes

The system shall treat sender and recipient address information as PII. Session data shall be retained only for the active kiosk transaction and purged immediately after success or timeout. Raw sensor streams should not be retained unless explicitly required for diagnostics. Normalized status values should be used consistently across frontend, backend, logging, and test validation.

## API Requirements

APIs should be structured around kiosk workflow capabilities rather than isolated device commands.

| API / Service | Purpose |
| ----- | ----- |
| Measurement API | Returns stabilized dimensions, weight, and tier |
| Address Validation API | Sends address data to USPS CASS and returns standardized result |
| Payment API | Initiates and monitors card terminal payment status |
| Label API | Requests tracking number and shipping label after payment approval |
| Print API | Sends label and receipt commands to the thermal printer |
| Session API | Tracks workflow state, timeout, reset, and data purge |

The frontend shall receive measurement updates through WebSocket or REST polling. Address and payment actions shall be routed through the backend so that hardware and USPS integrations remain isolated from the frontend.

## UX/UI Principles

PostalPulse Express should feel simple, guided, and trustworthy for customers who may not be familiar with shipping rules.

| Principle | Description |
| ----- | ----- |
| Clarity over density | Each screen should focus on one primary action |
| Guided progression | Users should understand what to do next at every step |
| Visible system status | Scanning, validation, payment, and printing states should be clear |
| Error recovery | Recoverable errors should explain the issue and provide a next action |
| Confirmation before payment | Users must review parcel, address, and cost details before paying |
| Privacy by design | Timeout and reset behavior should protect customer information |

## Non-Functional Requirements

### Scalability

Each kiosk should operate independently with local hardware orchestration. USPS API usage should support concurrent kiosk sessions across multiple retail locations without requiring shared session state between kiosks.

### Performance

Parcel detection and dimensioning shall complete in less than 3 seconds. Weight stabilization shall complete within 2 seconds of object placement. Address search results shall return in less than 500 milliseconds under normal operating conditions. The target end-to-end transaction time is less than 60 seconds.

### Availability and Reliability

The system shall degrade gracefully when a device or USPS service is unavailable. Hardware errors should be presented clearly to the customer. Payment, label generation, and printing failures should be logged and handled without leaving the session in an ambiguous state.

### Security

All session data, including PII, shall be cleared from memory immediately after shipment success or timeout. Payment data shall be handled through the compliant payment terminal and shall not be stored by the kiosk application.

### Maintainability

The backend should keep hardware integrations modular so that camera, scale, payment terminal, printer, and USPS services can be updated or replaced without redesigning the full kiosk workflow.

## Reporting and Export

This release does not define customer-facing reporting or export features. Operational logs may be used for diagnostics, performance monitoring, and failure investigation. Logs should avoid storing PII unless explicitly required and approved.

## Error Handling and Edge Cases

| Scenario | Expected Behavior |
| ----- | ----- |
| Obstructed parcel scan | Display an error indicating the parcel cannot be clearly detected |
| Unstable weight | Continue sampling until stable or prompt the user to adjust the parcel |
| Invalid address | Display Address Not Found and block progression |
| Payment declined | Display Transaction Failed and allow retry |
| Label generation failure | Show fulfillment error and prevent false success state |
| Printer unavailable | Display printer error and prevent completion until resolved |
| Idle user | Show timeout warning after 60 seconds, then reset after 5 more seconds |
| Oversized or overweight parcel | Mark parcel as not eligible for configured flat-rate flow |

## Acceptance Criteria

### Parcel Measurement and Classification

* The system measures parcel dimensions within \+/- 0.2 inches of actual size.  
* Detection and measurement complete in less than 3 seconds.  
* Weight stabilizes within 2 seconds of parcel placement.  
* The system correctly classifies parcels into Small, Medium, or Large Flat Rate tiers.  
* A small-dimension parcel weighing 4 lbs is reclassified according to the valid weight-based tier rule.

### Address Validation

* Sender and recipient addresses are collected sequentially.  
* Address search results return in less than 500 milliseconds.  
* Only CASS-Verified addresses can proceed to payment.  
* Invalid ZIP codes or non-existent addresses trigger an Address Not Found warning.

### Payment and Fulfillment

* Payment is available only after parcel and address validation are complete.  
* Approved payments trigger tracking number and label generation.  
* The label prints with the correct tracking ID after successful payment.  
* Declined cards show a Transaction Failed message and allow the user to retry.

### Session Security

* After 60 seconds of inactivity, the timeout warning modal appears.  
* After the 5-second countdown, the app resets to Landing.  
* All session data is purged immediately after Success or Timeout.

### **Test Coverage**

| ID | Title | Scenario | Expected Result |
| ----- | ----- | ----- | ----- |
| TC-01 | Happy Path | Standard Medium box placed, address searched, payment approved | Success screen reached and label prints with correct tracking ID |
| TC-02 | Obstruction Error | User leaves hand on the parcel during scan | “Oops\! We can’t see the parcel” error triggers |
| TC-03 | Weight Override | Small box weighs 4 lbs | System correctly reclassifies box as Medium based on weight limit |
| TC-04 | Invalid Address | User enters a non-existent ZIP code | CASS validation fails and Address Not Found warning displays |
| TC-05 | Idle Timeout | User walks away at the Verify Summary page | After 60 seconds, countdown modal appears. After 5 more seconds, app resets to Landing |
| TC-06 | Payment Failure | Card is declined by the terminal | Transaction Failed message appears and user returns to Summary to retry |

## Open Questions and Next Steps

| Question / Next Step | Notes |
| ----- | ----- |
| Confirm USPS label API contract | Required for tracking number and label payload details |
| Confirm supported parcel deposit workflow | Needed to define chute interaction and post-label behavior |
| Confirm printer output format | Label PDF, ZPL, PNG, or terminal-specific print payload |
| Confirm payment provider integration | Needed for exact payment states and retry behavior |
| Confirm diagnostic logging policy | Determines whether raw device errors or measurement data can be retained |
| Confirm exact tier rules | Current specification preserves provided Small, Medium, and Large thresholds |

## Definition of Terms Appendix

| Term | Definition |
| ----- | ----- |
| PostalPulse Express | Automated USPS self-service shipping kiosk |
| CASS | USPS Coding Accuracy Support System used for address validation and standardization |
| Depth Camera | Optical sensor used to capture parcel dimensions |
| Integrated Scale | Digital scale used to capture parcel weight |
| Flat Rate Tier | Parcel classification category based on configured size and weight limits |
| Sender Address | Return address entered by the customer |
| Recipient Address | Destination address entered by the customer |
| Tracking Number | USPS identifier generated after successful payment and label creation |
| Thermal Printer | Kiosk printer used to produce shipping labels and receipts |
| Session Data | Temporary customer and shipment data stored during a kiosk transaction |
| Timeout | Automatic session reset after inactivity |

UX  
[USPS Kiosk prototype.mov](https://drive.google.com/file/d/1Z8_a3IrK9OP2rlDTTL8B8vuw9MJqQxA_/view?usp=sharing)  
