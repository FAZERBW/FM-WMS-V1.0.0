
import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Customer, SaleItem, SaleRecord, ExtraCharge, LabourCost, CustomerType } from '../types';
import { getProductHierarchy, createSale, getMechanics } from '../services/dataService';
import { useThemeStore, getThemeColors } from '../hooks/useTheme';
import { Plus, Trash2, CheckSquare, DollarSign } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { addMonths } from 'date-fns';
import { generateWarrantyCard } from '../lib/canvas';

interface SaleWizardProps {
  customer: Customer;
  onClose: () => void;
}

export const SaleWizard: React.FC<SaleWizardProps> = ({ customer, onClose }) => {
  // Master State
  const [step, setStep] = useState(1);
  const [saleType, setSaleType] = useState<CustomerType>('C1');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [billNo, setBillNo] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Detailed Payment State
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([
      { id: '1', label: '', amount: 0, isIncludedInBill: false },
      { id: '2', label: '', amount: 0, isIncludedInBill: false },
      { id: '3', label: '', amount: 0, isIncludedInBill: false },
  ]);

  const [fittingLabour, setFittingLabour] = useState<LabourCost>({ 
      type: 'FITTING', provider: 'OURS', name: '', amount: 0, isIncludedInBill: false 
  });
  
  const [settingLabour, setSettingLabour] = useState<LabourCost>({ 
      type: 'SETTING', provider: 'OURS', name: '', amount: 0, isIncludedInBill: false 
  });

  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [referrerId, setReferrerId] = useState(''); // For C2
  const [referrerMargin, setReferrerMargin] = useState<number>(0); // For C2
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helpers
  const { theme, setTheme } = useThemeStore();
  const colors = getThemeColors(theme);
  const productDB = getProductHierarchy();
  const mechanics = getMechanics();

  // Initialize
  useEffect(() => {
    // Default to first vehicle if exists
    if (customer.vehicles.length > 0) {
      setSelectedVehicleId(customer.vehicles[0].id);
    }
    addItem(); // Start with one item
  }, []);

  useEffect(() => {
    setTheme(saleType === 'C1' ? 'blue' : 'orange');
  }, [saleType, setTheme]);

  // --- Logic ---

  const addItem = () => {
    setItems([...items, {
      id: uuidv4(),
      brand: '',
      wattage: '',
      model: '',
      serialNumber: '',
      warrantyDurationMonths: 12,
      expiryDate: 0,
      billAmount: 0,
      dealerPrice: 0,
      extras: 0
    }]);
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // Auto-set Warranty
    if (field === 'brand' || field === 'wattage') {
        if (item.brand && item.wattage) {
            const variants = productDB[item.brand];
            const variant = variants?.find(v => v.wattage === item.wattage);
            if (variant) item.warrantyDurationMonths = variant.warrantyMonths;
        }
    }

    newItems[index] = item;
    setItems(newItems);
  };
  
  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // --- Calculations ---

  const getBilledAmount = () => {
    // Sum of Items + Included Extras
    const itemsTotal = items.reduce((sum, item) => sum + (item.billAmount || 0), 0);
    const extrasIncluded = extraCharges.filter(c => c.isIncludedInBill).reduce((sum, c) => sum + (c.amount || 0), 0);
    const labourIncluded = (fittingLabour.isIncludedInBill ? (fittingLabour.amount || 0) : 0) + (settingLabour.isIncludedInBill ? (settingLabour.amount || 0) : 0);
    return itemsTotal + extrasIncluded + labourIncluded;
  };

  const getTotalReceivable = () => {
    // Billed Amount + Excluded Extras
    const billed = getBilledAmount();
    const extrasExcluded = extraCharges.filter(c => !c.isIncludedInBill).reduce((sum, c) => sum + (c.amount || 0), 0);
    const labourExcluded = (!fittingLabour.isIncludedInBill ? (fittingLabour.amount || 0) : 0) + (!settingLabour.isIncludedInBill ? (settingLabour.amount || 0) : 0);
    return billed + extrasExcluded + labourExcluded;
  };
  
  const calculateTotalMargin = () => {
      const itemMargin = items.reduce((sum, item) => sum + ((item.billAmount || 0) - (item.dealerPrice || 0)), 0);
      return itemMargin;
  };

  const handleFinalize = async () => {
      if (!billNo) return alert("Enter Bill Number");
      if (items.some(i => !i.brand || !i.model || !i.serialNumber)) return alert("Complete all item details");
      
      setIsSubmitting(true);
      const vehicle = customer.vehicles.find(v => v.id === selectedVehicleId);
      const vehicleStr = vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.regNumber})` : 'N/A';
      
      const finalDate = new Date(saleDate).getTime();
      
      // Calculate Expiry for each item
      const processedItems = items.map(item => ({
          ...item,
          expiryDate: addMonths(finalDate, item.warrantyDurationMonths).getTime()
      }));

      const record: SaleRecord = {
          id: uuidv4(),
          billNumber: billNo,
          date: finalDate,
          customerType: saleType,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerAddress: customer.address,
          vehicleId: selectedVehicleId,
          vehicleStr: vehicleStr,
          
          mechanicId: saleType === 'C2' ? referrerId : undefined,
          totalMargin: saleType === 'C2' ? calculateTotalMargin() : 0,
          
          items: processedItems,
          
          paymentDetails: {
              billedAmount: getBilledAmount(),
              extraCharges: extraCharges.filter(c => c.label && c.amount),
              fittingLabour: fittingLabour.amount ? fittingLabour : undefined,
              settingLabour: settingLabour.amount ? settingLabour : undefined,
              totalReceivable: getTotalReceivable(),
              receivedAmount: parseFloat(receivedAmount) || 0,
              balanceAmount: getTotalReceivable() - (parseFloat(receivedAmount) || 0),
              paymentMode: 'Cash', // Default
              referrerName: saleType === 'C2' ? mechanics.find(m => m.id === referrerId)?.name : undefined,
              referrerMargin: saleType === 'C2' ? referrerMargin : 0
          },
          
          totalBill: getTotalReceivable(), 
          redemptions: []
      };

      try {
          createSale(record);
          await generateWarrantyCard(record);
          onClose();
      } catch (e) {
          alert("Error saving sale");
          console.error(e);
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- Render Steps ---

  const renderStep1_Vehicle = () => (
      <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Select Vehicle</h3>
          <div className="grid grid-cols-1 gap-3">
              {customer.vehicles.map(v => (
                  <div 
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${
                        selectedVehicleId === v.id 
                        ? 'bg-sky-500/20 border-sky-500 text-white' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                      <div>
                          <p className="font-bold text-lg">{v.regNumber}</p>
                          <p className="text-sm text-slate-400">{v.make} {v.model}</p>
                      </div>
                      {selectedVehicleId === v.id && <CheckSquare className="text-sky-400"/>}
                  </div>
              ))}
          </div>
          <button 
            onClick={() => setStep(2)}
            disabled={!selectedVehicleId}
            className="w-full py-3 bg-sky-600 disabled:opacity-50 rounded-xl text-white font-bold mt-4"
          >
              Next: Add Products
          </button>
      </div>
  );

  const renderStep2_Products = () => (
      <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Add Products</h3>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3 relative group">
                      <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-[10px] text-slate-400 uppercase">Brand</label>
                              <select 
                                  className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm text-white"
                                  value={item.brand}
                                  onChange={e => {
                                      updateItem(idx, 'brand', e.target.value);
                                      updateItem(idx, 'wattage', '');
                                  }}
                              >
                                  <option value="">Select Brand</option>
                                  {Object.keys(productDB).map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] text-slate-400 uppercase">Wattage</label>
                              <select 
                                  className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm text-white"
                                  value={item.wattage}
                                  onChange={e => updateItem(idx, 'wattage', e.target.value)}
                                  disabled={!item.brand}
                              >
                                  <option value="">Select</option>
                                  {item.brand && productDB[item.brand]?.map(v => <option key={v.id} value={v.wattage}>{v.wattage}</option>)}
                              </select>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-[10px] text-slate-400 uppercase">Model</label>
                              <select 
                                  className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm text-white"
                                  value={item.model}
                                  onChange={e => updateItem(idx, 'model', e.target.value)}
                                  disabled={!item.wattage}
                              >
                                  <option value="">Select</option>
                                  {item.brand && item.wattage && productDB[item.brand].find(v => v.wattage === item.wattage)?.models.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] text-slate-400 uppercase">Serial No.</label>
                              <input 
                                  className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm text-white font-mono"
                                  value={item.serialNumber}
                                  onChange={e => updateItem(idx, 'serialNumber', e.target.value)}
                                  placeholder="SCAN"
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-[10px] text-slate-400 uppercase">Price (To Cust)</label>
                              <input 
                                  type="number"
                                  className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm text-white"
                                  value={item.billAmount}
                                  onChange={e => updateItem(idx, 'billAmount', parseFloat(e.target.value))}
                              />
                          </div>
                          {saleType === 'C2' && (
                              <div>
                                  <label className="text-[10px] text-orange-400 uppercase">Dealer Price</label>
                                  <input 
                                      type="number"
                                      className="w-full bg-orange-500/10 border border-orange-500/20 rounded p-2 text-sm text-orange-200"
                                      value={item.dealerPrice}
                                      onChange={e => updateItem(idx, 'dealerPrice', parseFloat(e.target.value))}
                                  />
                              </div>
                          )}
                      </div>
                  </div>
              ))}
              <button onClick={addItem} className="w-full py-2 border border-dashed border-white/20 rounded-lg text-slate-400 hover:text-white flex items-center justify-center text-sm">
                  <Plus size={14} className="mr-1"/> Add Item
              </button>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setStep(1)} className="py-3 bg-white/5 rounded-xl text-slate-400">Back</button>
              <button onClick={() => setStep(3)} className="py-3 bg-sky-600 rounded-xl text-white font-bold">Next</button>
          </div>
      </div>
  );

  const renderStep3_Details = () => (
      <div className="space-y-5">
           <h3 className="text-lg font-bold text-white">Details & Labour</h3>
           
           {/* C1 / C2 Toggle */}
           <div className="flex bg-slate-900 p-1 rounded-xl">
               <button onClick={() => setSaleType('C1')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${saleType === 'C1' ? 'bg-sky-500 text-white' : 'text-slate-500'}`}>
                   Customer (C1)
               </button>
               <button onClick={() => setSaleType('C2')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${saleType === 'C2' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}>
                   Mechanic (C2)
               </button>
           </div>

           {/* C2 Fields */}
           {saleType === 'C2' && (
               <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl space-y-3">
                   <div>
                       <label className="text-xs text-orange-300 uppercase font-bold">Referrer (Wireman/Mech)</label>
                       <select 
                          className="w-full bg-slate-900/80 border border-orange-500/30 rounded-lg p-2 text-white"
                          value={referrerId}
                          onChange={e => setReferrerId(e.target.value)}
                       >
                           <option value="">Select Mechanic</option>
                           {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                   </div>
                   <div>
                       <label className="text-xs text-orange-300 uppercase font-bold">Referrer Margin (₹)</label>
                       <input 
                           type="number"
                           className="w-full bg-slate-900/80 border border-orange-500/30 rounded-lg p-2 text-white"
                           value={referrerMargin}
                           onChange={e => setReferrerMargin(parseFloat(e.target.value))}
                       />
                   </div>
               </div>
           )}
           
           {/* Labour Section */}
           <div className="space-y-3">
               <div className="grid grid-cols-12 gap-2 items-center text-xs text-slate-400 font-bold uppercase mb-1">
                   <div className="col-span-3">Type</div>
                   <div className="col-span-3">Provider</div>
                   <div className="col-span-3">Amount</div>
                   <div className="col-span-3 text-center">Incl in Bill</div>
               </div>
               
               {/* Fitting */}
               <div className="grid grid-cols-12 gap-2 items-center bg-white/5 p-2 rounded-lg">
                   <div className="col-span-3 text-sm text-white">Fitting</div>
                   <div className="col-span-3">
                       <select 
                         className="w-full bg-slate-900 border border-white/10 rounded text-xs p-1 text-white"
                         value={fittingLabour.provider}
                         onChange={e => setFittingLabour({...fittingLabour, provider: e.target.value as any})}
                       >
                           <option value="OURS">Ours</option>
                           <option value="THEIRS">Theirs</option>
                           <option value="SELF">Self</option>
                       </select>
                   </div>
                   <div className="col-span-3">
                        <input 
                          type="number"
                          className="w-full bg-slate-900 border border-white/10 rounded text-xs p-1 text-white"
                          value={fittingLabour.amount}
                          onChange={e => setFittingLabour({...fittingLabour, amount: parseFloat(e.target.value)})}
                        />
                   </div>
                   <div className="col-span-3 flex justify-center">
                       <input type="checkbox" checked={fittingLabour.isIncludedInBill} onChange={e => setFittingLabour({...fittingLabour, isIncludedInBill: e.target.checked})}/>
                   </div>
               </div>

               {/* Setting */}
               <div className="grid grid-cols-12 gap-2 items-center bg-white/5 p-2 rounded-lg">
                   <div className="col-span-3 text-sm text-white">Setting</div>
                    <div className="col-span-3">
                       <select 
                         className="w-full bg-slate-900 border border-white/10 rounded text-xs p-1 text-white"
                         value={settingLabour.provider}
                         onChange={e => setSettingLabour({...settingLabour, provider: e.target.value as any})}
                       >
                           <option value="OURS">Ours</option>
                           <option value="THEIRS">Theirs</option>
                           <option value="SELF">Self</option>
                       </select>
                   </div>
                   <div className="col-span-3">
                        <input 
                          type="number"
                          className="w-full bg-slate-900 border border-white/10 rounded text-xs p-1 text-white"
                          value={settingLabour.amount}
                          onChange={e => setSettingLabour({...settingLabour, amount: parseFloat(e.target.value)})}
                        />
                   </div>
                   <div className="col-span-3 flex justify-center">
                       <input type="checkbox" checked={settingLabour.isIncludedInBill} onChange={e => setSettingLabour({...settingLabour, isIncludedInBill: e.target.checked})}/>
                   </div>
               </div>
           </div>

           {/* Extra Charges */}
           <div className="space-y-2">
               <p className="text-xs font-bold text-slate-400 uppercase">Extra Charges</p>
               {extraCharges.map((charge, idx) => (
                   <div key={charge.id} className="grid grid-cols-12 gap-2 items-center">
                       <div className="col-span-5">
                           <input placeholder={`Note ${idx+1}`} className="w-full bg-slate-900 border border-white/10 rounded text-xs p-2 text-white" value={charge.label} onChange={e => {
                               const newC = [...extraCharges]; newC[idx].label = e.target.value; setExtraCharges(newC);
                           }}/>
                       </div>
                       <div className="col-span-3">
                           <input type="number" placeholder="0" className="w-full bg-slate-900 border border-white/10 rounded text-xs p-2 text-white" value={charge.amount} onChange={e => {
                               const newC = [...extraCharges]; newC[idx].amount = parseFloat(e.target.value); setExtraCharges(newC);
                           }}/>
                       </div>
                       <div className="col-span-4 flex items-center space-x-2 text-xs text-slate-400">
                           <input type="checkbox" checked={charge.isIncludedInBill} onChange={e => {
                               const newC = [...extraCharges]; newC[idx].isIncludedInBill = e.target.checked; setExtraCharges(newC);
                           }}/>
                           <span>Incl. in Bill</span>
                       </div>
                   </div>
               ))}
           </div>

           <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setStep(2)} className="py-3 bg-white/5 rounded-xl text-slate-400">Back</button>
              <button onClick={() => setStep(4)} className="py-3 bg-sky-600 rounded-xl text-white font-bold">Next: Finalize</button>
           </div>
      </div>
  );

  const renderStep4_Payment = () => {
      const billed = getBilledAmount();
      const receivable = getTotalReceivable();
      const balance = receivable - (parseFloat(receivedAmount) || 0);

      return (
          <div className="space-y-6">
              <h3 className="text-lg font-bold text-white">Payment & Finalize</h3>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs text-slate-400 uppercase font-bold">Bill Number</label>
                      <input 
                        className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-white font-mono font-bold"
                        value={billNo}
                        onChange={e => setBillNo(e.target.value)}
                        placeholder="1001"
                      />
                  </div>
                  <div>
                      <label className="text-xs text-slate-400 uppercase font-bold">Date</label>
                      <input 
                        type="date"
                        className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-white"
                        value={saleDate}
                        onChange={e => setSaleDate(e.target.value)}
                      />
                  </div>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Billed Amount</span>
                      <span className="text-white">₹{billed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Other Charges (Excluded)</span>
                      <span className="text-white">₹{receivable - billed}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-lg">
                      <span className="text-sky-400">Total Receivable</span>
                      <span className="text-white">₹{receivable}</span>
                  </div>
              </div>

              <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1">Received Amount</label>
                  <div className="relative">
                      <DollarSign className="absolute left-3 top-3.5 text-slate-500" size={16}/>
                      <input 
                          type="number"
                          className="w-full bg-slate-900 border border-white/10 pl-10 p-3 rounded-xl text-white font-bold text-lg"
                          value={receivedAmount}
                          onChange={e => setReceivedAmount(e.target.value)}
                          placeholder="0"
                      />
                  </div>
                  <p className={`text-right text-sm mt-1 font-bold ${balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {balance > 0 ? `Balance: ₹${balance}` : 'Paid in Full'}
                  </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                  <button onClick={() => setStep(3)} className="py-3 bg-white/5 rounded-xl text-slate-400">Back</button>
                  <button 
                    onClick={handleFinalize} 
                    disabled={isSubmitting}
                    className="py-3 bg-green-600 rounded-xl text-white font-bold flex items-center justify-center disabled:opacity-50"
                  >
                      {isSubmitting ? 'Saving...' : 'Finalize Sale'}
                  </button>
              </div>
          </div>
      );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`New Sale: ${customer.name}`} size="lg">
       <div className="mb-4">
           {/* Progress Indicator */}
           <div className="flex items-center space-x-2">
               {[1,2,3,4].map(s => (
                   <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? 'bg-sky-500' : 'bg-slate-800'}`} />
               ))}
           </div>
       </div>
       
       {step === 1 && renderStep1_Vehicle()}
       {step === 2 && renderStep2_Products()}
       {step === 3 && renderStep3_Details()}
       {step === 4 && renderStep4_Payment()}

    </Modal>
  );
};
