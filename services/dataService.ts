
import { 
  SaleRecord, 
  MechanicProfile, 
  LedgerEntry, 
  ProductHierarchy,
  WarrantyClaim,
  Customer,
  FittingConfig
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useHistoryStore } from '../hooks/useHistory';

/**
 * MOCK DATA SERVICE with History Integration
 */

const STORAGE_KEYS = {
  SALES: 'fm_wms_sales',
  MECHANICS: 'fm_wms_mechanics',
  LEDGER: 'fm_wms_ledger',
  SETTINGS: 'fm_wms_settings', // Products
  FITTINGS: 'fm_wms_fittings', // Vehicle Fittings
  CUSTOMERS: 'fm_wms_customers',
  CLAIMS: 'fm_wms_claims'
};

// --- Helpers ---
const getLocal = <T>(key: string, def: T): T => {
  const s = localStorage.getItem(key);
  return s ? JSON.parse(s) : def;
};

const setLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- History Wrapper ---
const withHistory = <T>(
  description: string, 
  key: string, 
  mutator: (currentData: T) => T,
  isDeleteOperation: boolean = false
) => {
  const currentData = getLocal<T>(key, [] as any);
  const previousData = JSON.parse(JSON.stringify(currentData)); // Deep copy
  
  // Apply mutation
  const newData = mutator(currentData);
  setLocal(key, newData);

  // Add to History Store
  useHistoryStore.getState().addHistory({
    description,
    undo: () => {
      setLocal(key, previousData);
      window.dispatchEvent(new Event('storage-update'));
    },
    redo: () => {
      setLocal(key, newData);
      window.dispatchEvent(new Event('storage-update'));
    }
  });

  window.dispatchEvent(new Event('storage-update'));
  return newData;
};

// --- Import / Export ---
export type ExportScope = 'FULL' | 'LABOUR' | 'SALES';

export const exportData = (scope: ExportScope): string => {
  const data: any = {};
  
  if (scope === 'FULL' || scope === 'LABOUR') {
    data.mechanics = getMechanics();
    data.ledger = getLedger();
  }
  
  if (scope === 'FULL' || scope === 'SALES') {
    data.sales = getSales();
    data.customers = getCustomers();
    data.claims = getLocal(STORAGE_KEYS.CLAIMS, []);
  }

  if (scope === 'FULL') {
    data.settings = getProductHierarchy();
    data.fittings = getFittingConfig();
  }

  return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string, scope: ExportScope) => {
  try {
    const data = JSON.parse(jsonString);
    const backup: any = {};
    // ... (simplified backup logic for brevity, same as before)

    if (data.mechanics && (scope === 'FULL' || scope === 'LABOUR')) setLocal(STORAGE_KEYS.MECHANICS, data.mechanics);
    if (data.ledger && (scope === 'FULL' || scope === 'LABOUR')) setLocal(STORAGE_KEYS.LEDGER, data.ledger);
    if (data.sales && (scope === 'FULL' || scope === 'SALES')) setLocal(STORAGE_KEYS.SALES, data.sales);
    if (data.customers && (scope === 'FULL' || scope === 'SALES')) setLocal(STORAGE_KEYS.CUSTOMERS, data.customers);
    if (data.settings && scope === 'FULL') setLocal(STORAGE_KEYS.SETTINGS, data.settings);
    if (data.fittings && scope === 'FULL') setLocal(STORAGE_KEYS.FITTINGS, data.fittings);

    window.dispatchEvent(new Event('storage-update'));
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// --- Products & Fittings ---
export const getProductHierarchy = (): ProductHierarchy => {
  // New Structure Default Data
  return getLocal(STORAGE_KEYS.SETTINGS, {
    "Osram": [
      { id: "v1", wattage: "100/90W", warrantyMonths: 12, models: ["Rally", "Night Breaker"] },
      { id: "v2", wattage: "60/55W", warrantyMonths: 6, models: ["Standard"] }
    ],
    "Thor LED": [
      { id: "v3", wattage: "310W", warrantyMonths: 24, models: ["H4", "H7", "H8"] },
      { id: "v4", wattage: "180W", warrantyMonths: 12, models: ["H4"] }
    ],
    "RPL LED": [
      { id: "v5", wattage: "380W", warrantyMonths: 24, models: ["H4", "H7"] }
    ]
  });
};

export const saveProductHierarchy = (data: ProductHierarchy) => {
  withHistory("Updated Product Config", STORAGE_KEYS.SETTINGS, () => data);
};

export const getFittingConfig = (): FittingConfig => {
  return getLocal(STORAGE_KEYS.FITTINGS, {
    "Mahindra": {
      "Scorpio": {
        "M2DI": "H4",
        "Classic S11": "H7 (Low) / H7 (High)"
      }
    },
    "Maruti": {
      "Swift": {
        "VXI (Old)": "H4",
        "ZXI+ (New)": "LED Projector"
      }
    }
  });
};

export const saveFittingConfig = (data: FittingConfig) => {
  withHistory("Updated Fitting Database", STORAGE_KEYS.FITTINGS, () => data);
};


// --- Customers ---
export const getCustomers = (): Customer[] => {
  return getLocal(STORAGE_KEYS.CUSTOMERS, []);
};

export const getCustomerByPhone = (phone: string): Customer | undefined => {
  return getCustomers().find(c => c.phone === phone);
};

export const createCustomer = (customer: Customer) => {
  withHistory(
    `New Customer: ${customer.name}`,
    STORAGE_KEYS.CUSTOMERS,
    (list: Customer[]) => [...list, customer]
  );
};

export const updateCustomer = (id: string, updates: Partial<Customer>) => {
  withHistory(
    `Updated Customer`,
    STORAGE_KEYS.CUSTOMERS,
    (list: Customer[]) => list.map(c => c.id === id ? { ...c, ...updates } : c)
  );
};

// --- Mechanics ---
export const getMechanics = (): MechanicProfile[] => {
  return getLocal(STORAGE_KEYS.MECHANICS, []);
};

export const createMechanic = (name: string, phone: string) => {
  const newMech: MechanicProfile = { id: uuidv4(), name, phone, walletBalance: 0 };
  withHistory(`Created Profile: ${name}`, STORAGE_KEYS.MECHANICS, (current: MechanicProfile[]) => [...current, newMech]);
  return newMech;
};

export const updateMechanic = (id: string, updates: Partial<MechanicProfile>) => {
  withHistory(`Updated Profile`, STORAGE_KEYS.MECHANICS, (list: MechanicProfile[]) => list.map(m => m.id === id ? { ...m, ...updates } : m));
};

export const deleteMechanic = (id: string) => {
  withHistory(`Deleted Profile`, STORAGE_KEYS.MECHANICS, (list: MechanicProfile[]) => list.filter(m => m.id !== id), true);
};

// --- Ledger ---
export const addLedgerEntry = (entry: Omit<LedgerEntry, 'id' | 'date'>) => {
  const fullEntry: LedgerEntry = { ...entry, id: uuidv4(), date: Date.now() };
  withHistory(
    `Ledger: ${entry.type} ₹${entry.amount}`,
    STORAGE_KEYS.LEDGER,
    (list: LedgerEntry[]) => [...list, fullEntry]
  );
  
  // Update balance side-effect
  const mechs = getMechanics();
  const mechIndex = mechs.findIndex(m => m.id === entry.mechanicId);
  if (mechIndex > -1) {
    const newMechs = [...mechs];
    if (entry.type === 'CREDIT') newMechs[mechIndex].walletBalance += entry.amount;
    else newMechs[mechIndex].walletBalance -= entry.amount;
    setLocal(STORAGE_KEYS.MECHANICS, newMechs);
    window.dispatchEvent(new Event('storage-update'));
  }
};

export const getLedger = (mechanicId?: string): LedgerEntry[] => {
  const all = getLocal<LedgerEntry[]>(STORAGE_KEYS.LEDGER, []);
  if (mechanicId) return all.filter(l => l.mechanicId === mechanicId);
  return all;
};

// --- Sales ---
export const createSale = (sale: SaleRecord) => {
  withHistory(
    `New Sale: #${sale.billNumber}`,
    STORAGE_KEYS.SALES,
    (list: SaleRecord[]) => [...list, sale]
  );

  // Side effect: Margin to Ledger
  if (sale.customerType === 'C2' && sale.mechanicId && sale.totalMargin) {
    addLedgerEntry({
      mechanicId: sale.mechanicId,
      type: 'CREDIT',
      amount: sale.totalMargin,
      description: `Margin for Bill #${sale.billNumber}`,
      referenceId: sale.id
    });
  }
};

export const updateSale = (id: string, updates: Partial<SaleRecord>) => {
  withHistory(
    `Updated Sale`,
    STORAGE_KEYS.SALES,
    (list: SaleRecord[]) => list.map(s => s.id === id ? { ...s, ...updates } : s)
  );
};

export const deleteSale = (id: string) => {
   withHistory(
    `Deleted Sale`,
    STORAGE_KEYS.SALES,
    (list: SaleRecord[]) => list.filter(s => s.id !== id),
    true
  );
}

export const getSales = (): SaleRecord[] => {
  return getLocal<SaleRecord[]>(STORAGE_KEYS.SALES, []);
};

export const getSaleById = (id: string): SaleRecord | undefined => {
  return getSales().find(s => s.id === id);
};

export const createClaim = (claim: WarrantyClaim) => {
  withHistory(`Claim: ${claim.status}`, STORAGE_KEYS.CLAIMS, (list: WarrantyClaim[]) => [...list, claim]);
};
