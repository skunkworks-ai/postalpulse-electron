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
      badge: 'MeldPOST Hub Terminal 1',
      headingPrefix: 'Ship It',
      headingHighlight: 'Smarter.',
      description: 'Automated sensing, CASS validation, and instant postage for a seamless shipping experience.',
      startShipment: 'Start Shipment'
    },
    detection: {
      idle: {
        title: 'Automatic Sensing',
        description: 'Optical array is analyzing parcel volume.'
      },
      error: {
        title: 'Alignment Error',
        description: 'Please reposition your parcel.'
      },
      failureTitle: 'Detection Failed',
      failureDescription: 'Please align your parcel with the markings on the scale surface.',
      restartScan: 'Restart Scan',
      tempProceed: 'Temp Proceed',
      mappingSuffix: 'Mapping',
      debugTrigger: 'Debug: Trigger Visibility Error',
      cameraFeedAlt: 'RealSense camera feed'
    },
    confirmation: {
      badge: 'Metric Confirmation',
      title: 'Parcel Metrics Analysis',
      volumetricClass: 'Volumetric Class',
      actualDimensions: 'Actual Dimensions',
      boxDimensions: 'Box Dimensions',
      massDensity: 'Mass Density',
      massDensityMetric: 'Kilograms',
      totalTariff: 'Total Tariff',
      rateConfirmed: 'Rate Confirmed',
      discard: 'Discard',
      setDestination: 'Add Sender and Recipient'
    },
    address: {
      sender: {
        title: 'Sender Details',
        section: 'Address Verification',
        entityIdentifier: 'Full Name',
        namePlaceholder: 'John A. Doe',
        registryLabel: 'Sender Address',
        searchPlaceholder: 'Search US Address...',
        overrideManual: 'Override Manual',
        manualEntry: 'Manual Entry',
        switchToSearch: 'Switch to Search',
        streetLabel: 'Street Address',
        cityLabel: 'City',
        stateLabel: 'State',
        zipLabel: 'ZIP Code',
        validate: 'CASS Validate',
        validating: 'Validating...',
        progress: 'CASS Validation in Progress...',
        validated: 'Address is CASS Validated',
        notValidated: 'Address Not CASS Validated',
        back: 'Return',
        next: 'Confirm Sender Details'
      },
      recipient: {
        title: 'Recipient Details',
        section: 'Address Verification',
        entityIdentifier: 'Full Name',
        namePlaceholder: 'John A. Doe',
        registryLabel: 'Recipient Address',
        searchPlaceholder: 'Search US Address...',
        overrideManual: 'Override Manual',
        manualEntry: 'Manual Entry',
        switchToSearch: 'Switch to Search',
        streetLabel: 'Street Address',
        cityLabel: 'City',
        stateLabel: 'State',
        zipLabel: 'ZIP Code',
        validate: 'CASS Validate',
        validating: 'Validating...',
        progress: 'CASS Validation in Progress...',
        validated: 'Address is CASS Validated',
        notValidated: 'Address Not CASS Validated',
        back: 'Return',
        next: 'Confirm Recipient Details'
      }
    },
    verify: {
      badge: 'Verification',
      title: 'Shipment Review',
      subtitle: 'Verify the details of your shipment before proceeding to payment.',
      originIntel: 'Sender Details',
      targetNode: 'Recipient Details',
      modifyOrigin: 'Modify Sender',
      modifyTarget: 'Modify Recipient',
      class: 'Class',
      actualDimensions: 'Actual Dimensions',
      dimensions: 'Dimensions',
      payload: 'Payload',
      authorizedRate: 'Authorized Rate',
      back: 'Back',
      executeTransaction: 'Procceed to Payment'
    },
    payment: {
      generatingTag: 'Generating Tag',
      processing: 'Processing',
      title: 'Postage Allocation',
      description: 'Terminal active. Please insert secure credentials or tap NFC reader.',
      simulateEncryption: 'SIMULATE ENCRYPTION',
      secureLink: 'Establishing Secure Link...',
      deauthorizeTransaction: 'De-authorize Transaction'
    },
    success: {
      title: 'Transaction Complete',
      subtitle: 'Protocol finalized effectively.',
      phyOutputReady: 'PHY-OUTPUT READY',
      retrieveTag: 'Retrieve Tag',
      retrieveTagDescription:
        'Your secure identification tag has been deployed to the output module located at the base of the terminal.',
      trackingHashLabel: 'Tracking Hash',
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