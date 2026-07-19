export interface LineItem {
  lotNoMarking: string;
  quantity: string;       // string for controlled input, converted to number on submit
  packed: string;
  netWeightPerCase: string;
  totalLb: string;        // auto-calculated but editable
  size: string;
  description: string;
}

export interface BolFormData {
  // Header
  shipper: string;
  destinationLine1: string;
  destinationLine2: string;
  destinationLine3: string;
  date: string;
  po: string;
  storageType: 'FREEZER' | 'COOLER' | 'OTHER' | '';

  // Table
  lineItems: LineItem[];

  // Summary
  totalCases: string;
  totalWeightLb: string;

  // Time
  timeOfPickUp: string;
  timeOfDelivery: string;

  // Checklist
  packingIsClean: boolean;
  labelsApplied: boolean;
  tempIsAcceptable: boolean;
  countAndWeight: boolean;
  packagingNotBroken: boolean;
  msc: boolean;
  receivedInGoodOrder: boolean;

  // Carrier
  pcpApproved: string;
  signature: string;
  nameOfCarrier: string;
  driversPrintNameSign: string;
  consignee: string;

  // Bottom
  truckTemperaturePreLoading: string;
}

export const emptyLineItem = (): LineItem => ({
  lotNoMarking: '',
  quantity: '',
  packed: '',
  netWeightPerCase: '',
  totalLb: '',
  size: '',
  description: '',
});

export const emptyForm = (): BolFormData => ({
  shipper: '',
  destinationLine1: '',
  destinationLine2: '',
  destinationLine3: '',
  date: new Date().toISOString().slice(0, 10),
  po: '',
  storageType: '',
  lineItems: [emptyLineItem()],
  totalCases: '',
  totalWeightLb: '',
  timeOfPickUp: '',
  timeOfDelivery: '',
  packingIsClean: false,
  labelsApplied: false,
  tempIsAcceptable: false,
  countAndWeight: false,
  packagingNotBroken: false,
  msc: false,
  receivedInGoodOrder: false,
  pcpApproved: '',
  signature: '',
  nameOfCarrier: '',
  driversPrintNameSign: '',
  consignee: '',
  truckTemperaturePreLoading: '',
});
