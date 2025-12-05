
export type CustomerType = 'C1' | 'C2'; // C1: Direct, C2: Mechanic/Referrer

export interface ShopProfile {
  name: string;
  mobile1: string;
  mobile2: string;
  address: string;
  slogan: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  variant?: string; // Optional as requested
  regNumber: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  type: CustomerType;
  vehicles: Vehicle[];
  registeredDate: number;
}

export interface ProductVariant {
  id: string;
  wattage: string;
  warrantyMonths: number;
  models: string[];
}

export type ProductHierarchy = Record<string, ProductVariant[]>; // Brand -> Variants

export interface SaleItem {
  id: string;
  brand: string;
  wattage: string;
  model: string;
  serialNumber: string;
  warrantyDurationMonths: number;
  expiryDate: number;
  billAmount: number;
  dealerPrice?: number;
  extras?: number;
}

export interface ExtraCharge {
  id: string;
  label: string;
  amount: number;
  isIncludedInBill: boolean;
}

export interface LabourCost {
  type: 'FITTING' | 'SETTING';
  provider: 'OURS' | 'THEIRS' | 'SELF';
  name?: string;
  amount: number;
  isIncludedInBill: boolean;
}

export interface PaymentDetails {
  billedAmount: number;
  extraCharges: ExtraCharge[];
  fittingLabour?: LabourCost;
  settingLabour?: LabourCost;
  totalReceivable: number;
  receivedAmount: number;
  balanceAmount: number;
  paymentMode: 'Cash' | 'Online' | 'UPI';
  referrerName?: string;
  referrerMargin?: number;
}

export interface ReturnTracking {
  status: 'AT_SHOP' | 'SENT_TO_COMPANY' | 'CREDIT_RECEIVED';
  sentDate?: number;
  courierName?: string;
  lrNumber?: string;
  creditDate?: number;
  creditNoteNumber?: string;
  creditAmount?: number;
}

export interface RedemptionRecord {
  id: string;
  date: number;
  type: 'REPLACEMENT' | 'REFUND';
  oldItemSerial: string;
  newItemSerial?: string;
  reason: string;
  notes?: string;
  returnTracking?: ReturnTracking;
}

export interface SaleRecord {
  id: string;
  billNumber: string;
  date: number;
  customerType: CustomerType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  
  vehicleId?: string;
  vehicleStr?: string;

  mechanicId?: string; // If C2
  totalMargin?: number; // If C2

  items: SaleItem[];
  paymentDetails: PaymentDetails;
  totalBill: number;
  
  redemptions: RedemptionRecord[];
}

export interface MechanicProfile {
  id: string;
  name: string;
  phone: string;
  walletBalance: number;
}

export interface LedgerEntry {
  id: string;
  mechanicId: string;
  date: number;
  type: 'CREDIT' | 'DEBIT' | 'PAYOUT';
  amount: number;
  description: string;
  referenceId?: string;
}

export type FittingConfig = Record<string, Record<string, Record<string, string>>>; 

export interface WarrantyClaim {
  id: string;
  originalSaleId: string;
  itemSerial: string;
  claimDate: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOID';
  damageType: 'PHYSICAL' | 'WIRE_CUT' | 'BROKEN_GLASS' | 'INTERNAL_FAILURE';
  notes: string;
}
