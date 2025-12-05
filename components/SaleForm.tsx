import React, { useState, useEffect } from 'react';
import { CustomerType, SaleItem, ProductHierarchy, MechanicProfile, SaleRecord } from '../types';
import { useThemeStore, getThemeColors } from '../hooks/useTheme';
import { GlassCard } from './ui/GlassCard';
import { getProductHierarchy, getMechanics, createSale } from '../services/dataService';
import { Plus, Trash2, Save, User, Wrench, Printer } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { generateWarrantyCard } from '../lib/canvas';

export const SaleForm: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const colors = getThemeColors(theme);
  
  // Master State
  const [customerType, setCustomerType] = useState<CustomerType>('C1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Item State
  const [items, setItems] = useState<SaleItem[]>([]);
  
  // Data State
  const [products, setProducts] = useState<ProductHierarchy>({});
  const [mechanics, setMechanics] = useState<MechanicProfile[]>([]);

  useEffect(() => {
    setProducts(getProductHierarchy());
    setMechanics(getMechanics());
    // Start with one empty item
    if (items.length === 0) addItem();
  }, []);

  // Handle Type Toggle
  useEffect(() => {
    setTheme(customerType === 'C1' ? 'blue' : 'orange');
  }, [customerType, setTheme]);

  // Add Empty Item
  const addItem = () => {
    setItems([...items, {
      id: uuidv4(),
      brand: '',
      wattage: '',
      model: '',
      serialNumber: '',
      warrantyDurationMonths: 12, // default
      expiryDate: 0, // will be calculated on submit
      billAmount: 0,
      dealerPrice: 0,
      extras: 0
    }]);
  };

  // Update Item
  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Financials
  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.billAmount || 0) + (item.extras || 0), 0);
  };

  const calculateTotalMargin = () => {
    if (customerType === 'C1') return 0;
    return items.reduce((acc, item) => {
      const revenue = (item.billAmount || 0) + (item.extras || 0);
      const cost = (item.dealerPrice || 0); 
      return acc + (revenue - cost);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Add at least one item');
    if (customerType === 'C2' && !selectedMechanic) return alert('Select a mechanic');
    if (!billNumber) return alert('Please enter Bill Number');

    setIsSubmitting(true);

    const saleId = uuidv4();
    const saleDate = Date.now();
    
    // Resolve Name
    let finalCustomerName = customerName;
    if (customerType === 'C2') {
      const mech = mechanics.find(m => m.id === selectedMechanic);
      finalCustomerName = mech ? `${mech.name} (Mech)` : 'Unknown Mechanic';
    }

    const saleRecord: SaleRecord = {
      id: saleId,
      billNumber: billNumber,
      date: saleDate,
      customerType,
      customerId: customerType === 'C2' ? selectedMechanic : uuidv4(),
      customerName: finalCustomerName,
      customerPhone,
      mechanicId: selectedMechanic || undefined,
      items,
      paymentDetails: {
        billedAmount: calculateTotal(),
        extraCharges: [],
        totalReceivable: calculateTotal(),
        receivedAmount: calculateTotal(),
        balanceAmount: 0,
        paymentMode: 'Cash',
        referrerMargin: calculateTotalMargin()
      },
      totalBill: calculateTotal(),
      totalMargin: calculateTotalMargin(),
      redemptions: []
    };

    // 1. Save to DB
    createSale(saleRecord);

    // 2. Generate Warranty Card
    try {
      await generateWarrantyCard(saleRecord);
      alert('Sale Recorded & Warranty Card Downloaded!');
    } catch (error) {
      console.error(error);
      alert('Sale Recorded but PDF generation failed.');
    }

    // Reset
    setItems([]);
    addItem();
    setCustomerName('');
    setCustomerPhone('');
    setBillNumber('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-fade-in">
      {/* Header / Type Switcher */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          type="button"
          onClick={() => setCustomerType('C1')}
          className={`px-8 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 ${
            customerType === 'C1' 
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 scale-105' 
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <User size={20} />
          <span>Walk-in (C1)</span>
        </button>
        <button
           type="button"
          onClick={() => setCustomerType('C2')}
          className={`px-8 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 ${
            customerType === 'C2' 
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40 scale-105' 
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <Wrench size={20} />
          <span>Mechanic (C2)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <GlassCard title="Customer Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Bill Number</label>
               <input 
                 type="text" 
                 className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-mono"
                 value={billNumber}
                 onChange={(e) => setBillNumber(e.target.value)}
                 required
                 placeholder="e.g. 1001"
               />
            </div>

            {customerType === 'C2' ? (
               <div>
                 <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Mechanic</label>
                 <select 
                   className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                   value={selectedMechanic}
                   onChange={(e) => setSelectedMechanic(e.target.value)}
                   required
                 >
                   <option value="">-- Select Mechanic --</option>
                   {mechanics.map(m => (
                     <option key={m.id} value={m.id}>{m.name} (Bal: ₹{m.walletBalance})</option>
                   ))}
                 </select>
               </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Customer Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="Enter name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    placeholder="Enter phone"
                  />
                </div>
              </>
            )}
          </div>
        </GlassCard>

        {/* Product Grid */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="relative group">
              <GlassCard className="pr-12 transition-all hover:bg-white/[0.07]">
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Brand */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Brand</label>
                    <select 
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm focus:border-white/30 outline-none"
                      value={item.brand}
                      onChange={(e) => {
                        updateItem(index, 'brand', e.target.value);
                        updateItem(index, 'wattage', '');
                        updateItem(index, 'model', '');
                      }}
                      required
                    >
                      <option value="">Select Brand</option>
                      {Object.keys(products).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  
                  {/* Wattage */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Wattage</label>
                    <select 
                       className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm focus:border-white/30 outline-none disabled:opacity-50"
                       value={item.wattage}
                       onChange={(e) => {
                         updateItem(index, 'wattage', e.target.value);
                         updateItem(index, 'model', '');
                       }}
                       disabled={!item.brand}
                       required
                    >
                      <option value="">Select Wattage</option>
                      {/* FIX: Correctly map over product variants to get wattages */}
                      {item.brand && products[item.brand]?.map(variant => (
                        <option key={variant.id} value={variant.wattage}>{variant.wattage}</option>
                      ))}
                    </select>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Model</label>
                    <select 
                       className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm focus:border-white/30 outline-none disabled:opacity-50"
                       value={item.model}
                       onChange={(e) => updateItem(index, 'model', e.target.value)}
                       disabled={!item.wattage}
                       required
                    >
                      <option value="">Select Model</option>
                      {/* FIX: Correctly find the variant by wattage and then map its models */}
                      {item.brand && item.wattage && products[item.brand].find(v => v.wattage === item.wattage)?.models.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-slate-500 mb-1">Serial Number</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm font-mono tracking-wide focus:border-white/30 outline-none placeholder:text-slate-600"
                      value={item.serialNumber}
                      onChange={(e) => updateItem(index, 'serialNumber', e.target.value)}
                      placeholder="SCAN or TYPE"
                      required
                    />
                  </div>
                  
                  {/* Financials Row */}
                  {customerType === 'C2' && (
                    <div>
                      <label className="block text-xs text-amber-500/80 mb-1 font-semibold">Dealer Price</label>
                      <input 
                        type="number" 
                        className="w-full bg-amber-900/20 border border-amber-500/30 rounded-lg p-2.5 text-sm text-amber-200 focus:border-amber-500/50 outline-none"
                        value={item.dealerPrice}
                        onChange={(e) => updateItem(index, 'dealerPrice', parseFloat(e.target.value))}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Bill Amount</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm focus:border-white/30 outline-none"
                      value={item.billAmount}
                      onChange={(e) => updateItem(index, 'billAmount', parseFloat(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                     <label className="block text-xs text-slate-500 mb-1">Extras (Fitting)</label>
                     <input 
                      type="number" 
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-sm focus:border-white/30 outline-none"
                      value={item.extras}
                      onChange={(e) => updateItem(index, 'extras', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </GlassCard>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center space-x-2 group"
          >
            <Plus size={20} className="group-hover:scale-110 transition-transform" />
            <span>Add Another Product</span>
          </button>
        </div>
      </form>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0f172a]/80 backdrop-blur-xl border-t border-white/10 z-50 shadow-2xl">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Total Payable</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">₹ {calculateTotal().toLocaleString()}</span>
              {customerType === 'C2' && (
                <span className="text-xs text-orange-400 font-medium px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                  Margin: ₹ {calculateTotalMargin().toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-xl font-bold text-white shadow-xl ${colors.primary} ${colors.primaryHover} transition-all transform hover:scale-105 active:scale-95 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Printer size={20} />
            )}
            <span>{isSubmitting ? 'Processing...' : 'Complete & Print'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};