const en = {
  header: {
    title: 'MeldPOST',
    subtitle: 'Your Parcel Lodgement Service',
    hub: 'MeldPOST Hub',
  },
  stepIndicator: {
    welcome: 'Welcome',
    detection: 'Detection',
    confirmation: 'Confirm',
    sender: 'Sender',
    recipient: 'Recipient',
    verify: 'Verify',
    payment: 'Payment',
    success: 'Success'
  },
  steps: {
    welcome: {
      badge: 'MeldPOST Hub Lodgement Terminal 1',
      headingPrefix: 'Drop It',
      headingHighlight: 'Securely.',
      description: 'Secure automated scanning, physical measurement, and barcode validation',
      startShipment: 'Scan to Start Process',
      startShipmentSubtitle: 'Scanning will simulate scanning a parcel and retrieve the booking details',
    },
    detection: {
      headingPrefix: 'Validating Barcode',
      description: 'Querying security cloud databases to verify booking specifications and parcel details.',
    },
    confirmation: {
      badge: 'Lodgement Signature Verified',
      title: 'Parcel Metrics',
      senderLabel: 'Registered Sender',
      recipientLabel: 'Registered Recipient',
      volumetricClass: 'Volumetric Class',
      actualDimensions: 'Actual Dimensions',
      boxDimensions: 'Box Dimensions',
      massDensity: 'Mass Density',
      massDensityMetric: 'Kilograms',
      totalTariff: 'Total Tariff',
      rateConfirmed: 'Rate Confirmed',
      discard: 'Cancel',
      setDestination: 'Confirm'
    },
    scanning: {
      idle: {
        title: 'Place Parcel Inside',
        description: 'Place the parcel inside the rotating chamber. Ensure the label faces up.'
      },
      detecting: {
        title: 'Checking Safety Custody',
        description: 'Please wait while we verify the parcel details and ensure it is securely placed for transit.'
      },
      error: {
        title: 'Detection Error',
        description: 'An error occurred during parcel detection. Please ensure the parcel is correctly placed and try again.'
      },
      incorrectDetectionError: {
        title: 'Barcode unreadable. Please ensure the parcel label is facing up and is clearly visible to the camera.',
      },
      mismatchDetectionError: {
        title: 'Mismatched Detected. The parcel inside does not match the scanned booking details. Please ensure the correct parcel is placed inside.',
      },
      failureTitle: 'Detection Failed',
      failureDescription: 'Please align your parcel with the markings on the scale surface.',
      restartScan: 'Restart Scan',
      tempProceed: 'Temp Proceed',
      mappingSuffix: 'Scanning',
      debugTrigger: 'Debug: Trigger Visibility Error',
      cameraFeedAlt: 'RealSense camera feed',
      simulateSuccessLabel: 'Simulate Successful Detection',
      simulateIncorrectDetectionLabel: 'Simulate Incorrect Detection',
      simulateMismatchDetectionLabel: 'Simulate Mismatch Detection',
      retrieveParcelLabel: 'Retrieve Parcel',
      cancelSessionLabel: 'Cancel Session'
    },
    success: {
      title: 'Transfer Successful',
      subtitle: 'Custody Transfer Complete.',
      description: 'The parcel has been securely lodged and is ready for transit. Please take your receipt and proceed to the designated collection point.',
      phyOutputReady: 'PHY-OUTPUT READY',
      retrieveTag: 'Printing Lodgement Proof',
      retrieveTagDescription:
        'Commiting digitally...',
      trackingHashLabel: 'Tracking Number',
      digiRecord: 'DIGI-RECORD',
      accessReceipt: 'Access Receipt',
      accessReceiptDescription:
        'Transmit a copy of this official record to your personal digital repository.',
      dispatchViaEmail: 'Dispatch via Email',
      dynamicQrScan: 'Dynamic QR Scan',
      printLabel: 'Print Label',
      terminateSession: 'TERMINATE SESSION'
    }
  }
} as const

export default en