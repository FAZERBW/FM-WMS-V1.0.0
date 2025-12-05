
import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from './ui/GlassCard';
import { exportData, importData, ExportScope, getFittingConfig, saveFittingConfig } from '../services/dataService';
import { ProductConfigManager } from './ProductConfigManager';
import { useHistoryStore } from '../hooks/useHistory';
import { useShopStore } from '../hooks/useShopStore';
import { Modal } from './ui/Modal';
import { 
  Download, Upload, Share2, Store, History, RotateCcw,
  Check, X
} from 'lucide-react';
import { FittingConfig } from '../types';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'DATA' | 'SHOP'>('PRODUCTS');
  const [scope, setScope] = useState<ExportScope>('FULL');
  const [jsonInput, setJsonInput] = useState('');
  const { history, performUndo } = useHistoryStore();
  const { shop, updateShop } = useShopStore();

  // Shop Form
  const [shopForm, setShopForm] = useState(shop);

  // Restore Modal
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]); // For fitting restore

  useEffect(() => {
    setShopForm(shop);
  }, [shop]);

  const handleSaveShop = () => {
    updateShop(shopForm);
    alert('Shop details updated successfully!');
  };

  const handleExport = () => {
      const data = exportData(scope);
      const fileName = `FM_WMS_${scope}_${new Date().toISOString().slice(0,10)}.json`;
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
              const content = JSON.parse(ev.target?.result as string);
              setImportPreview(content);
              if (content.fittings) {
                // If fitting data exists, prepare for selective restore
                setSelectedKeys(Object.keys(content.fittings));
                setIsRestoreModalOpen(true);
              } else {
                 // Direct import for other scopes
                 setJsonInput(ev.target?.result as string);
                 if(confirm("Import data immediately?")) {
                    importData(JSON.stringify(content), scope);
                    alert("Done.");
                 }
              }
            } catch (err) {
              alert("Invalid JSON");
            }
        };
        reader.readAsText(file);
    }
  };

  const processSelectiveRestore = () => {
    if (!importPreview || !importPreview.fittings) return;
    
    // Construct new fitting object based on selection
    const newFittings: FittingConfig = {};
    selectedKeys.forEach(key => {
      newFittings[key] = importPreview.fittings[key];
    });

    // Merge or Overwrite? Let's overwrite specific keys in current DB, keep others
    const current = getFittingConfig();
    const merged = { ...current, ...newFittings };
    
    saveFittingConfig(merged);
    setIsRestoreModalOpen(false);
    alert("Fitting configuration updated selectively.");
  };

  const toggleKey = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter(k => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
        {[{ id: 'PRODUCTS', label: 'Products' }, { id: 'DATA', label: 'Data & Backup' }, { id: 'SHOP', label: 'Shop Profile' }].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-sky-500 text-white shadow-lg' : 'bg-white/10 text-slate-500'}`}
            >
                {tab.label}
            </button>
        ))}
      </div>
      
      {activeTab === 'PRODUCTS' && <ProductConfigManager />}

      {activeTab === 'SHOP' && (
          <GlassCard title="Shop Management" action={<Store className="text-sky-500"/>}>
              <div className="space-y-4">
                  <input value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} className="w-full bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-3" placeholder="Shop Name" />
                  <input value={shopForm.slogan} onChange={e => setShopForm({...shopForm, slogan: e.target.value})} className="w-full bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-3" placeholder="Slogan" />
                  <div className="grid grid-cols-2 gap-4">
                    <input value={shopForm.mobile1} onChange={e => setShopForm({...shopForm, mobile1: e.target.value})} className="w-full bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-3" placeholder="Mobile 1" />
                    <input value={shopForm.mobile2} onChange={e => setShopForm({...shopForm, mobile2: e.target.value})} className="w-full bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-3" placeholder="Mobile 2" />
                  </div>
                  <textarea value={shopForm.address} onChange={e => setShopForm({...shopForm, address: e.target.value})} className="w-full bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-3 h-24 resize-none" placeholder="Address" />
                  <button onClick={handleSaveShop} className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 rounded-xl text-white font-bold">Save Profile</button>
              </div>
          </GlassCard>
      )}

      {activeTab === 'DATA' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard title="System Backup">
              <div className="space-y-5">
                 <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-xl">
                   {['FULL', 'LABOUR', 'SALES'].map(s => (
                     <button key={s} onClick={() => setScope(s as ExportScope)} className={`flex-1 py-2 text-xs font-bold rounded-lg ${scope === s ? 'bg-white dark:bg-slate-700 shadow-md text-sky-600' : 'text-slate-500'}`}>{s}</button>
                   ))}
                 </div>
                 <div className="flex flex-col space-y-3">
                   <button onClick={handleExport} className="w-full py-3 bg-sky-600 rounded-xl text-white font-bold flex items-center justify-center space-x-2">
                       <Download size={18} /> <span>Download JSON</span>
                   </button>
                   <label className="w-full py-3 bg-slate-700 rounded-xl text-white font-bold flex items-center justify-center space-x-2 cursor-pointer">
                        <Upload size={18} /> <span>Import File</span>
                        <input type="file" className="hidden" accept=".json" onChange={handleFileLoad} />
                   </label>
                 </div>
              </div>
            </GlassCard>

            <GlassCard title="History">
               <div className="space-y-3">
                 {history.map(item => (
                   <div key={item.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <History size={16} />
                        <span className="text-sm">{item.description}</span>
                      </div>
                      <button onClick={() => performUndo(item.id)} className="p-2 text-amber-500 hover:bg-amber-500/20 rounded"><RotateCcw size={16}/></button>
                   </div>
                 ))}
               </div>
            </GlassCard>
        </div>
      )}

      <Modal isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)} title="Selective Restore" size="lg">
         <div className="space-y-4">
            <p className="text-sm text-slate-400">Select which Make configurations to restore/import:</p>
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
               {importPreview?.fittings && Object.keys(importPreview.fittings).map(key => (
                 <button 
                   key={key} 
                   onClick={() => toggleKey(key)}
                   className={`p-3 rounded-lg border text-left flex justify-between items-center ${selectedKeys.includes(key) ? 'bg-sky-500/20 border-sky-500 text-white' : 'border-white/10 text-slate-500'}`}
                 >
                   <span>{key}</span>
                   {selectedKeys.includes(key) && <Check size={16} />}
                 </button>
               ))}
            </div>
            <div className="flex space-x-2">
               <button onClick={() => setSelectedKeys(Object.keys(importPreview?.fittings || {}))} className="text-xs text-sky-400">Select All</button>
               <button onClick={() => setSelectedKeys([])} className="text-xs text-slate-400">Deselect All</button>
            </div>
            <button onClick={processSelectiveRestore} className="w-full py-3 bg-green-600 rounded-xl text-white font-bold">Confirm Restore</button>
         </div>
      </Modal>
    </div>
  );
};
