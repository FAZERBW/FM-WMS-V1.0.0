import React, { useState } from 'react';
import { GlassCard } from './ui/GlassCard';
import { AlertCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { getSaleById, createClaim } from '../services/dataService';
import { SaleRecord, SaleItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const ReplacementWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [searchId, setSearchId] = useState('');
  const [foundSale, setFoundSale] = useState<SaleRecord | null>(null);
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [damageType, setDamageType] = useState<string>('');
  
  const handleSearch = () => {
    // In reality this would search by ID or Serial
    // For demo, we just need a valid ID from the Sales list
    const sale = getSaleById(searchId);
    if (sale) {
      setFoundSale(sale);
      setStep(2);
    } else {
      alert('Sale not found. Try searching existing sales from Dashboard.');
    }
  };

  const handleDamageSelect = (type: string) => {
    setDamageType(type);
    const voidTypes = ['PHYSICAL', 'WIRE_CUT', 'BROKEN_GLASS'];
    
    if (voidTypes.includes(type)) {
      // Immediate Void
      alert('WARRANTY VOID: Physical damage detected.');
      submitClaim('VOID', type);
      setStep(4); // Void Screen
    } else {
      setStep(3); // Approve Screen
    }
  };

  const submitClaim = (status: 'APPROVED' | 'VOID', damage: string) => {
    if (!foundSale || !selectedItem) return;
    
    createClaim({
      id: uuidv4(),
      originalSaleId: foundSale.id,
      itemSerial: selectedItem.serialNumber,
      claimDate: Date.now(),
      status: status,
      damageType: damage as any,
      notes: 'Processed via Wizard'
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step 1: Identification */}
      {step === 1 && (
        <GlassCard title="Step 1: Identify Product">
          <div className="space-y-4">
             <label className="block text-sm text-slate-400">Scan QR Code / Enter Sale ID</label>
             <div className="flex space-x-2">
               <input 
                 type="text" 
                 value={searchId}
                 onChange={e => setSearchId(e.target.value)}
                 className="flex-1 bg-slate-800 border border-white/10 rounded-lg p-3 text-white"
                 placeholder="Paste Sale ID here..."
               />
               <button 
                 onClick={handleSearch}
                 className="bg-blue-600 hover:bg-blue-500 px-6 rounded-lg font-medium transition-colors"
               >
                 Search
               </button>
             </div>
             <p className="text-xs text-slate-500">
               Tip: Go to Dashboard, copy a Sale ID, and paste it here to test.
             </p>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Select Item */}
      {step === 2 && foundSale && (
        <GlassCard title="Step 2: Select Item to Replace">
          <div className="space-y-3">
            {foundSale.items.map(item => (
              <div 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedItem?.id === item.id 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-white/10 hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-bold">{item.brand} - {item.model}</span>
                  <span className="font-mono text-sm text-slate-400">{item.serialNumber}</span>
                </div>
              </div>
            ))}
            <button 
              disabled={!selectedItem}
              onClick={() => setStep(2.5)}
              className="w-full bg-blue-600 py-3 rounded-lg mt-4 disabled:opacity-50"
            >
              Next: Inspect Damage
            </button>
          </div>
        </GlassCard>
      )}

      {/* Step 2.5: Damage Check (The Shield) */}
      {step === 2.5 && (
        <GlassCard title="Step 3: Damage Inspection">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => handleDamageSelect('PHYSICAL')}
              className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-left"
            >
              <AlertCircle className="text-red-500 mb-2" />
              <h4 className="font-bold text-red-100">Physical Damage</h4>
              <p className="text-xs text-red-200/60">Dents, cracks, water ingress</p>
            </button>
             <button 
              onClick={() => handleDamageSelect('BROKEN_GLASS')}
              className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-left"
            >
              <XCircle className="text-red-500 mb-2" />
              <h4 className="font-bold text-red-100">Broken Glass</h4>
              <p className="text-xs text-red-200/60">Shattered or cracked lens</p>
            </button>
            <button 
              onClick={() => handleDamageSelect('WIRE_CUT')}
              className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-left"
            >
              <XCircle className="text-red-500 mb-2" />
              <h4 className="font-bold text-red-100">Wire Cut / Altered</h4>
              <p className="text-xs text-red-200/60">Connectors removed</p>
            </button>
            
            <button 
              onClick={() => handleDamageSelect('INTERNAL_FAILURE')}
              className="p-6 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-left"
            >
              <CheckCircle className="text-green-500 mb-2" />
              <h4 className="font-bold text-green-100">Internal Failure</h4>
              <p className="text-xs text-green-200/60">Not working, no physical signs</p>
            </button>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Approval */}
      {step === 3 && (
        <GlassCard className="border-green-500/50 bg-green-500/5">
          <div className="text-center py-8">
            <div className="inline-flex p-4 rounded-full bg-green-500/20 text-green-400 mb-4">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Warranty Approved</h2>
            <p className="text-slate-400 mb-6">Proceed with replacement unit.</p>
            <button 
              onClick={() => {
                submitClaim('APPROVED', damageType);
                alert('Replacement Authorized. Inventory updated.');
                setStep(1);
              }}
              className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-bold text-white"
            >
              Issue Replacement
            </button>
          </div>
        </GlassCard>
      )}

      {/* Step 4: Void */}
      {step === 4 && (
        <GlassCard className="border-red-500/50 bg-red-500/5">
          <div className="text-center py-8">
            <div className="inline-flex p-4 rounded-full bg-red-500/20 text-red-400 mb-4">
              <XCircle size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Warranty VOID</h2>
            <p className="text-slate-400 mb-6">
              Reason: {damageType.replace('_', ' ')}
            </p>
            <button 
              onClick={() => setStep(1)}
              className="bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded-lg text-white"
            >
              Return to Menu
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};