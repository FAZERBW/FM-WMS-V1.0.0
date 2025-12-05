
import React, { useState, useEffect } from 'react';
import { GlassCard } from './ui/GlassCard';
import { Modal } from './ui/Modal';
import { Customer, Vehicle } from '../types';
import { getCustomers, createCustomer, updateCustomer, getCustomerByPhone } from '../services/dataService';
import { SaleWizard } from './SaleWizard';
import { 
  Search, Plus, ChevronDown, ChevronUp, 
  Car, UserPlus, CheckSquare, AlertTriangle, PlayCircle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// FORMATTER: Automatically inserts dashes while typing
const formatVehicleNumberInput = (value: string) => {
  // Remove existing dashes and non-alphanumeric
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Handle empty
  if (!clean) return '';

  // Logic: 
  // 1. First 2 chars (State/Year) -> Add Dash
  // 2. Next 2 chars (RTO/BH) -> Add Dash
  // 3. Next 1-3 chars (Series) -> If followed by number, Add Dash
  // 4. Last 4 digits

  // Simple State-RTO-Series-Number implementation (MH-18-AA-1234)
  // or BH Series (23-BH-1234-AA)
  
  let formatted = clean;

  if (clean.length > 2) {
    formatted = clean.slice(0, 2) + '-' + clean.slice(2);
  }
  if (clean.length > 4) {
    formatted = formatted.slice(0, 5) + '-' + clean.slice(4);
  }
  
  // This logic is tricky for variable length series (A vs AA vs AAA)
  // We'll stick to a simpler "Insert dash after 2, 4, and before last 4 digits" heuristic if length is sufficient
  // Or just strict blocks for standard plates: 2 - 2 - Var - 4
  
  // Heuristic for standard plates while typing:
  // MH1 -> MH-1
  // MH18 -> MH-18
  // MH18A -> MH-18-A
  // MH18AB -> MH-18-AB
  // MH18AB1 -> MH-18-AB-1
  
  // Re-implementing strictly based on the prompt's example: MH - 18 - IT - 9754
  
  const state = clean.slice(0, 2);
  const rto = clean.slice(2, 4);
  let series = '';
  let number = '';
  
  if (clean.length > 4) {
    // Try to find where numbers start after the 4th character
    const remaining = clean.slice(4);
    const firstDigitIndex = remaining.search(/\d/);
    
    if (firstDigitIndex > -1) {
        series = remaining.slice(0, firstDigitIndex);
        number = remaining.slice(firstDigitIndex, firstDigitIndex + 4); // Max 4 digits
    } else {
        series = remaining;
    }
  }

  let res = state;
  if (state.length === 2 && clean.length > 2) res += '-' + rto;
  if (rto.length === 2 && series.length > 0) res += '-' + series;
  if (series.length > 0 && number.length > 0) res += '-' + number;

  return res;
};

export const CustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  
  // Registration Wizard
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [regPhone, setRegPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

  // Vehicle Modal
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [activeCustomerForVehicle, setActiveCustomerForVehicle] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({});
  
  // Sales Flow
  const [isSaleWizardOpen, setIsSaleWizardOpen] = useState(false);
  const [activeCustomerForSale, setActiveCustomerForSale] = useState<Customer | null>(null);

  useEffect(() => {
    refresh();
    window.addEventListener('storage-update', refresh);
    return () => window.removeEventListener('storage-update', refresh);
  }, []);

  const refresh = () => {
    setCustomers(getCustomers());
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // --- Registration Logic ---
  const handlePhoneVerify = () => {
    if (regPhone.length < 10) return alert("Enter valid 10-digit number");
    const found = getCustomerByPhone(regPhone);
    if (found) {
      setExistingCustomer(found); // Show modal with existing details
    } else {
      setExistingCustomer(null);
      setRegStep(2); // Proceed to details
    }
  };

  const completeRegistration = () => {
    if (!regName) return alert("Name is required");
    
    const newCust: Customer = {
      id: uuidv4(),
      name: regName,
      phone: regPhone,
      address: regAddress,
      type: 'C1', // Default, selectable in Sale
      vehicles: [],
      registeredDate: Date.now()
    };
    
    createCustomer(newCust);
    setIsRegModalOpen(false);
    resetRegForm();
    
    // Auto open vehicle modal for new customer
    if(confirm("Customer registered! Add a vehicle now?")) {
        openVehicleModal(newCust.id);
    }
    
    // Expand in list
    setFilterText(regPhone);
  };

  const resetRegForm = () => {
    setRegPhone('');
    setRegName('');
    setRegAddress('');
    setRegStep(1);
    setExistingCustomer(null);
  };

  // --- Vehicle Logic ---
  const openVehicleModal = (customerId: string, vehicle?: Vehicle) => {
    setActiveCustomerForVehicle(customerId);
    setVehicleForm(vehicle || { make: '', model: '', variant: '', regNumber: '' });
    setIsVehicleModalOpen(true);
  };

  const handleVehicleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const formatted = formatVehicleNumberInput(val);
      setVehicleForm(prev => ({...prev, regNumber: formatted}));
  };

  const saveVehicle = () => {
    if (!activeCustomerForVehicle || !vehicleForm.make || !vehicleForm.regNumber) return alert("Make and Reg Number are required");
    
    const cust = customers.find(c => c.id === activeCustomerForVehicle);
    if (!cust) return;

    let newVehicles = [...cust.vehicles];
    if (vehicleForm.id) {
      newVehicles = newVehicles.map(v => v.id === vehicleForm.id ? { ...v, ...vehicleForm } as Vehicle : v);
    } else {
      newVehicles.push({ ...vehicleForm, id: uuidv4() } as Vehicle);
    }

    updateCustomer(cust.id, { vehicles: newVehicles });
    setIsVehicleModalOpen(false);
  };

  // --- Sale Trigger ---
  const startSale = (customer: Customer) => {
    if (customer.vehicles.length === 0) {
      if(confirm("This customer has no vehicles. Add a vehicle first?")) {
        openVehicleModal(customer.id);
        return;
      }
    }
    setActiveCustomerForSale(customer);
    setIsSaleWizardOpen(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(filterText.toLowerCase()) || 
    c.phone.includes(filterText)
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search Name or Mobile..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>
        
        <button 
          onClick={() => setIsRegModalOpen(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          <UserPlus size={18} />
          <span>Register Customer</span>
        </button>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.map(c => (
          <GlassCard key={c.id} className={`transition-all duration-300 ${expandedId === c.id ? 'ring-1 ring-sky-500/30 bg-white/10' : ''} p-0 overflow-hidden`}>
            
            <div 
              onClick={() => toggleExpand(c.id)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg">
                   {c.name.charAt(0)}
                 </div>
                 <div>
                   <h3 className="font-bold text-white text-lg">{c.name}</h3>
                   <p className="text-sm text-slate-400 font-mono">{c.phone}</p>
                 </div>
              </div>
              <div className="flex items-center space-x-4">
                 <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">{c.vehicles.length} Vehicles</span>
                {expandedId === c.id ? <ChevronUp size={20} className="text-sky-400"/> : <ChevronDown size={20} className="text-slate-500"/>}
              </div>
            </div>

            {/* Expanded Profile */}
            {expandedId === c.id && (
              <div className="bg-[#0f172a]/50 border-t border-white/10 p-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Left: Vehicles */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-300 flex items-center">
                        <Car size={16} className="mr-2 text-sky-400"/> Registered Vehicles
                      </h4>
                      <button 
                        onClick={() => openVehicleModal(c.id)}
                        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sky-300 font-medium transition-colors"
                      >
                        + Add Vehicle
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {c.vehicles.length === 0 && <p className="text-sm text-slate-500 italic">No vehicles added yet.</p>}
                      {c.vehicles.map(v => (
                        <div key={v.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                           <div>
                             <p className="font-mono font-bold text-white tracking-wide">{v.regNumber}</p>
                             <p className="text-xs text-slate-400">{v.make} {v.model}</p>
                           </div>
                           <button onClick={() => openVehicleModal(c.id, v)} className="p-2 text-slate-500 hover:text-white"><CheckSquare size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col justify-center space-y-3">
                     <button 
                       onClick={() => startSale(c)}
                       className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2"
                     >
                       <PlayCircle size={20} />
                       <span>Start New Sale</span>
                     </button>
                     <div className="text-center">
                       <p className="text-xs text-slate-500 mt-2">{c.address || 'No address registered'}</p>
                     </div>
                  </div>

                </div>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* REGISTRATION MODAL */}
      <Modal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} title="New Customer Registration">
        {regStep === 1 && (
          <div className="space-y-4">
             <label className="block text-sm text-slate-400">Enter Mobile Number</label>
             <input 
               type="tel" 
               className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-white text-lg font-mono"
               placeholder="10 digit number"
               value={regPhone}
               onChange={e => setRegPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
             />
             
             {existingCustomer && (
               <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex items-start space-x-3">
                  <AlertTriangle className="text-orange-400 shrink-0" size={20} />
                  <div>
                    <h4 className="font-bold text-orange-400">Already Registered!</h4>
                    <p className="text-sm text-slate-300">Name: {existingCustomer.name}</p>
                    <p className="text-xs text-slate-500">{existingCustomer.vehicles.length} vehicles on file.</p>
                  </div>
               </div>
             )}

             <button 
               onClick={handlePhoneVerify}
               className="w-full py-3 bg-sky-600 rounded-xl text-white font-bold"
             >
               Verify & Proceed
             </button>
          </div>
        )}

        {regStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Customer Name</label>
              <input 
                className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-white"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="Full Name"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Address (Optional)</label>
              <textarea 
                className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-white resize-none h-24"
                value={regAddress}
                onChange={e => setRegAddress(e.target.value)}
                placeholder="Area, City..."
              />
            </div>
            <button 
              onClick={completeRegistration}
              className="w-full py-3 bg-green-600 rounded-xl text-white font-bold"
            >
              Save Profile
            </button>
          </div>
        )}
      </Modal>

      {/* VEHICLE MODAL */}
      <Modal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} title="Add/Edit Vehicle">
         <div className="space-y-4">
            <div className="bg-sky-500/10 p-3 rounded-lg border border-sky-500/20 text-sky-200 text-xs">
              <p>Registration numbers are formatted automatically as you type.</p>
            </div>
            <div>
               <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Registration Number</label>
               <input 
                 className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-white font-mono text-lg uppercase tracking-wider"
                 value={vehicleForm.regNumber || ''}
                 onChange={handleVehicleNumberChange}
                 placeholder="MH-18-IT-9754"
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Make</label>
                <input 
                  className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-white"
                  value={vehicleForm.make || ''}
                  onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})}
                  placeholder="e.g. Maruti"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Model</label>
                <input 
                  className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-white"
                  value={vehicleForm.model || ''}
                  onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})}
                  placeholder="e.g. Swift"
                />
              </div>
            </div>
            <div>
               <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Variant / Year (Optional)</label>
               <input 
                 className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-white"
                 value={vehicleForm.variant || ''}
                 onChange={e => setVehicleForm({...vehicleForm, variant: e.target.value})}
                 placeholder="e.g. VXI 2020"
               />
            </div>
            <button 
              onClick={saveVehicle}
              className="w-full py-3 bg-sky-600 rounded-xl text-white font-bold mt-2"
            >
              Save Vehicle
            </button>
         </div>
      </Modal>

      {/* SALE WIZARD */}
      {isSaleWizardOpen && activeCustomerForSale && (
        <SaleWizard 
          customer={activeCustomerForSale} 
          onClose={() => setIsSaleWizardOpen(false)} 
        />
      )}

    </div>
  );
};
